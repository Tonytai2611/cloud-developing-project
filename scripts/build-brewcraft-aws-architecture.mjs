import { execSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const kitRoot = execSync("drawio-ai root", { encoding: "utf8" }).trim();
const builderUrl = pathToFileURL(resolve(kitRoot, "src/builder.mjs")).href;
const layoutUrl = pathToFileURL(resolve(kitRoot, "src/layout-engine.mjs")).href;

const { Diagram } = await import(builderUrl);
const { group, frame, grid, icon, box, phantom, renderTree } = await import(layoutUrl);

const outDir = resolve("docs/architecture");
mkdirSync(outDir, { recursive: true });

const d = new Diagram("network");

const az = (suffix, label, cidr) =>
  group(`az_${suffix}`, "group_availability_zone", label, { dir: "col", gap: 18, align: "center", routeGap: 80 }, [
    group(`public_${suffix}`, "group_subnet", `Public Subnet ${cidr}`, { dir: "col", gap: 12, align: "center" }, [
      group(`ecs_sg_${suffix}`, "group_security_group", "ECS SG\ninbound from ALB SG only", { dir: "col", gap: 10, align: "center" }, [
        icon(`fargate_${suffix}`, "fargate", "ECS Fargate Task\nExpress API\npublic IP"),
      ]),
    ]),
  ]);

const tree = frame("root", "", { dir: "col", gap: 30, align: "center", routeGap: 110 }, [
  frame("clients", "Entry points", { dir: "row", gap: 50, align: "center" }, [
    icon("users", "user", "Customers / Admins"),
  ]),
  group("aws", "group_aws_cloud_alt", "AWS Cloud - BrewCraft DEV cost-optimized", { dir: "col", gap: 24, align: "center", routeGap: 110 }, [
    group("region", "group_region", "Region us-east-1", { dir: "col", gap: 24, align: "center", routeGap: 110 }, [
      frame("edge", "Public DNS and TLS", { dir: "row", gap: 36, align: "center" }, [
        icon("route53", "route_53", "Route 53\nbrewcraft.rocks"),
        icon("acm", "certificate_manager_3", "ACM\nTLS certificate"),
        icon("igw", "internet_gateway", "Internet Gateway"),
      ]),
      group("vpc", "group_vpc", "VPC 10.0.0.0/16 - no NAT Gateway", { dir: "col", gap: 24, align: "center", routeGap: 120 }, [
        group("alb_sg", "group_security_group", "ALB SG\n80/443 from Internet", { dir: "col", gap: 10, align: "center" }, [
          icon("alb", "application_load_balancer", "Application Load Balancer\n/health"),
        ]),
        phantom("az_row", "", { dir: "row", gap: 72, align: "top", header: 0, routeGap: 120 }, [
          az("a", "Availability Zone us-east-1a", "10.0.1.0/24"),
          az("b", "Availability Zone us-east-1b", "10.0.2.0/24"),
        ]),
      ]),
      frame("services", "Application dependencies", { dir: "row", gap: 34, align: "top", routeGap: 110 }, [
        grid("data", null, "Data, auth, and assets", { cols: 3, gap: 28 }, [
          icon("dynamodb", "dynamodb", "DynamoDB\nusers/menu/bookings/chat"),
          icon("cognito", "cognito", "Cognito\nuser pool + admin group"),
          icon("s3", "s3", "S3\nimages + failover site"),
        ]),
        grid("events", null, "Event-driven jobs", { cols: 4, gap: 24 }, [
          icon("sqs", "sqs", "SQS + DLQ\nqueues"),
          icon("lambda", "lambda", "Lambda\nnotifications/images/jobs"),
          icon("sns", "sns", "SNS\nemail/alerts"),
          icon("steps", "step_functions", "Step Functions\ncontact workflow"),
        ]),
      ]),
      frame("platform", "Delivery and observability", { dir: "row", gap: 34, align: "center" }, [
        icon("github", "githubactions", "GitHub Actions\nCI/CD"),
        icon("iam", "identity_access_management_iam_roles_anywhere", "IAM/OIDC\nleast privilege"),
        icon("ecr", "ecr", "ECR\napi/web images"),
        icon("cloudwatch", "cloudwatch_2", "CloudWatch\nlogs + alarms"),
      ]),
    ]),
  ]),
  frame("notes", "Architecture notes", { dir: "row", gap: 24, align: "center" }, [
    box("note_core", "Core synchronous APIs stay on Express/ECS:\nbooking CRUD, menu CRUD, profile, admin APIs.", { w: 310 }),
    box("note_async", "Event jobs move to Lambda:\nnotifications, image processing, reminders, queue workers.", { w: 310 }),
    box("note_cost", "DEV avoids NAT Gateway cost.\nFor production, private ECS subnets plus NAT or VPC endpoints can be added later.", { w: 330 }),
  ]),
]);

renderTree(d, tree, [40, 90]);
d.title("BrewCraft AWS Architecture - Cost-Optimized DEV");

d.link("users", "route53");
d.link("route53", "alb");
d.link("acm", "alb", "", { dash: true });
d.link("igw", "alb", "", { dash: true });
d.link("alb", "fargate_a", "", { role: "fanout" });
d.link("alb", "fargate_b", "", { role: "fanout" });
d.link("fargate_a", "data");
d.link("fargate_b", "events");
d.link("sqs", "lambda");
d.link("lambda", "sns");
d.link("steps", "lambda", "", { dash: true });
d.link("s3", "lambda", "", { dash: true });
d.link("github", "iam");
d.link("iam", "ecr");
d.link("lambda", "cloudwatch", "", { dash: true });

const validation = d.validate();
console.log("VALIDATE:", JSON.stringify({
  ok: validation.ok,
  errors: validation.errors,
  warnings: validation.warnings,
  advice: validation.audit.advice,
}, null, 2));

const drawioPath = resolve(outDir, "brewcraft-aws-cost-optimized.drawio");
writeFileSync(drawioPath, d.mxfile("BrewCraft AWS DEV"));
console.log(drawioPath);

if (!validation.ok || validation.errors.length || validation.warnings.length) {
  process.exitCode = 1;
}
