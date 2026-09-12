import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Mail, Lock, User, Check, X, UserCircle, Coffee, Phone, ArrowRight, CalendarDays, LoaderCircle, ShieldCheck, LogIn, UserPlus, ChevronDown, LogOut, Heart, Settings, Menu as MenuIcon } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "../ui/dialog";
import AWS from 'aws-sdk';
import CryptoJS from 'crypto-js';
import { toast } from 'sonner';
import { useAuth } from '../../hooks/useAuth';
import { env } from '../../config/env';

const Header = () => {
    const navigate = useNavigate();
    const { user, login: authLogin, logout: authLogout } = useAuth();
    const userDisplayName = user?.name || user?.email || user?.username || 'Account';
    const cafeHeroImage = `${process.env.PUBLIC_URL}/login&register.png`;
    const [activeTab, setActiveTab] = useState("login");
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dialogOpen, setDialogOpen] = useState(false);
    const [accountMenuOpen, setAccountMenuOpen] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    // Password requirements
    const passwordRequirements = [
        { label: 'At least 8 characters', test: (p) => p.length >= 8 },
        { label: 'One uppercase letter', test: (p) => /[A-Z]/.test(p) },
        { label: 'One lowercase letter', test: (p) => /[a-z]/.test(p) },
        { label: 'One number', test: (p) => /\d/.test(p) },
        { label: 'One special character', test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p) },
    ];

    // Generate SECRET_HASH for Cognito using crypto-js
    const generateSecretHash = (username, clientId, clientSecret) => {
        const message = username + clientId;
        const hash = CryptoJS.HmacSHA256(message, clientSecret);
        return CryptoJS.enc.Base64.stringify(hash);
    };

    // User info is managed by AuthProvider, no need for fetchUserInfo

    // Handle login with JWT
    const onSubmitLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await authLogin(username, password);
            console.log('Login result:', result); // Debug log
            console.log('result.isAdmin:', result.isAdmin);
            console.log('result.userInfo:', result.userInfo);
            console.log('result.userInfo?.role:', result.userInfo?.role);

            // Check if user is admin from multiple sources
            const isAdmin = result.isAdmin || result.userInfo?.role === 'admin' || result.userInfo?.isAdmin;
            console.log('Final isAdmin value:', isAdmin);

            toast.success("Welcome back!", {
                description: isAdmin ? "Redirecting to admin panel..." : "Login successful"
            });
            setDialogOpen(false);

            if (isAdmin) {
                console.log('Redirecting to /admin');
                navigate("/admin");
            } else {
                console.log('Redirecting to /');
                navigate("/");
            }
        } catch (err) {
            console.error("Login failure:", err);
            toast.error("Login failed", {
                description: err.message || "Invalid credentials"
            });
        } finally {
            setLoading(false);
        }
    };

    // Handle register
    const onSubmit = async (event) => {
        event.preventDefault();

        if (!username || !password || !name || !email || !phoneNumber) {
            toast.error("Missing fields", {
                description: "Please fill in all fields to register"
            });
            return;
        }

        // Basic phone validation (allow spaces, dashes, parentheses, plus)
        const cleanPhone = phoneNumber.replace(/[\s()-]/g, '');
        if (cleanPhone.length < 10) {
            toast.error("Invalid phone number", {
                description: "Please enter a valid phone number (at least 10 digits)"
            });
            return;
        }

        const clientId = env.cognitoClientId;
        const clientSecret = env.cognitoClientSecret;
        const region = env.awsRegion;

        if (!clientId || !region) {
            toast.error("Auth config missing", {
                description: "Please set REACT_APP_COGNITO_CLIENT_ID and REACT_APP_AWS_REGION"
            });
            return;
        }

        const cognitoUsername = email.trim().toLowerCase();
        const secretHash = clientSecret ? generateSecretHash(cognitoUsername, clientId, clientSecret) : null;

        const cognito = new AWS.CognitoIdentityServiceProvider({ region });

        // Format phone number to E.164
        // If it sends with +, use as is. If no +, assume it needs one. 
        // Note: Ideally we'd valid country code, but + prepending is a safe fallback for now if user omits it.
        const formattedPhoneNumber = cleanPhone.startsWith('+') ? cleanPhone : `+${cleanPhone}`;

        const params = {
            ClientId: clientId,
            Username: cognitoUsername,
            Password: password,
            UserAttributes: [
                {
                    Name: "email",
                    Value: cognitoUsername,
                },
                {
                    Name: "name",
                    Value: name,
                },
                {
                    Name: "phone_number",
                    Value: formattedPhoneNumber,
                },
            ],
        };
        if (secretHash) params.SecretHash = secretHash;

        try {
            const data = await cognito.signUp(params).promise();
            console.log("Sign-up successful:", data);
            toast.success("Registration successful!", {
                description: "Please check your email for verification code"
            });

            // persist registration info so verify page can include email/name/role
            localStorage.setItem('username', cognitoUsername);
            localStorage.setItem('email', cognitoUsername);
            localStorage.setItem('name', name);
            localStorage.setItem('role', 'customer');

            // Close dialog before navigating
            setDialogOpen(false);

            // Small delay to allow dialog to close smoothly
            setTimeout(() => {
                navigate('/verify-email');
            }, 100);
        } catch (err) {
            console.error("Error during sign-up:", err);
            toast.error("Registration failed", {
                description: err.message || "Error during sign-up"
            });
        }
    };

    // Handle logout with JWT
    const onLogout = async () => {
        try {
            setAccountMenuOpen(false);
            setMobileMenuOpen(false);
            await authLogout();
            toast.success("Logged out successfully");
            navigate("/");
        } catch (err) {
            console.error("Logout error:", err);
            toast.error("Logout failed", {
                description: err.message || "An error occurred"
            });
        }
    };

    const onUserProfile = () => {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
        navigate("/user-profile");
    };

    const closeMenus = () => {
        setAccountMenuOpen(false);
        setMobileMenuOpen(false);
    };

    return (
        <header className="app-header fixed top-0 z-50 w-full">
            <nav className="container relative flex h-20 items-center justify-between" aria-label="Main navigation">
                <div className="flex items-center gap-4">
                    <Link to="/" className="flex items-center gap-3">
                        <img src="/logo.png" alt="BrewCraft logo" className="h-[42px] w-[42px] rounded-xl object-cover shadow-md" />
                        <span className="text-2xl font-bold tracking-tight text-white">BrewCraft</span>
                    </Link>
                </div>

                <div className="hidden items-center gap-7 lg:flex">
                    <Link to="/" className="nav-link" onClick={closeMenus}>
                        Home
                    </Link>
                    <Link to="/menu" className="nav-link" onClick={closeMenus}>
                        Menu
                    </Link>
                    <Link to="/booking" className="nav-link" onClick={closeMenus}>
                        Reservation
                    </Link>
                    {user && (
                        <Link to="/my-bookings" className="nav-link" onClick={closeMenus}>
                            My Bookings
                        </Link>
                    )}
                    {!user && (
                        <>
                            <Link to="/#about" className="nav-link" onClick={closeMenus}>
                                About
                            </Link>
                            <Link to="/contact-us" className="nav-link" onClick={closeMenus}>
                                Contact
                            </Link>
                        </>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {user ? (
                        <div className="relative hidden md:block">
                            <button
                                type="button"
                                className="user-menu-trigger"
                                aria-haspopup="menu"
                                aria-expanded={accountMenuOpen}
                                onClick={() => setAccountMenuOpen((open) => !open)}
                            >
                                <UserCircle className="h-5 w-5" />
                                <span className="max-w-36 truncate">{userDisplayName}</span>
                                <ChevronDown className={`h-4 w-4 transition-transform ${accountMenuOpen ? "rotate-180" : ""}`} />
                            </button>
                            {accountMenuOpen && (
                                <div className="account-menu" role="menu">
                                    <button type="button" role="menuitem" onClick={onUserProfile}>
                                        <UserCircle className="h-4 w-4" />
                                        Profile
                                    </button>
                                    <Link to="/my-favourites" role="menuitem" onClick={closeMenus}>
                                        <Heart className="h-4 w-4" />
                                        My Favourites
                                    </Link>
                                    <Link to="/user-profile#settings" role="menuitem" onClick={closeMenus}>
                                        <Settings className="h-4 w-4" />
                                        Settings
                                    </Link>
                                    <button type="button" role="menuitem" onClick={onLogout} className="account-menu-danger">
                                        <LogOut className="h-4 w-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                            <DialogTrigger asChild>
                                <Button className="auth-trigger inline-flex h-11 min-w-24 items-center justify-center gap-2 rounded-xl border-amber-300/80 px-5 py-2.5 font-bold hover:!translate-y-0 active:!translate-y-0">
                                    <LogIn className="h-4 w-4" aria-hidden="true" />
                                    Login
                                </Button>
                            </DialogTrigger>

                            <DialogContent className="auth-dialog max-h-[92vh] w-[calc(100vw-2rem)] max-w-[960px] gap-0 overflow-hidden overflow-y-auto rounded-2xl border-0 bg-transparent p-0 shadow-2xl data-[state=closed]:animate-none data-[state=open]:animate-none">
                                <div className="auth-dialog-shell grid md:min-h-[720px] md:grid-cols-[350px_minmax(0,1fr)]">
                                    <aside className="auth-side-panel relative hidden overflow-hidden p-7 md:flex md:flex-col md:justify-between">
                                        <img
                                            src={cafeHeroImage}
                                            alt=""
                                            aria-hidden="true"
                                            className="absolute inset-0 h-full w-full object-cover object-center"
                                        />
                                        <div className="auth-side-overlay absolute inset-0" />
                                        <div className="relative">
                                            <div className="mb-7 inline-flex h-12 w-12 items-center justify-center rounded-full border border-amber-200/55 bg-black/20 text-amber-200 shadow-lg backdrop-blur-sm">
                                                <Coffee className="h-6 w-6" strokeWidth={1.7} />
                                            </div>
                                            <p className="mb-5 text-xs font-semibold uppercase tracking-[0.3em] text-amber-200">
                                                BrewCraft
                                            </p>
                                            <h2 className="max-w-sm font-serif text-[34px] font-semibold leading-[1.12] text-white">
                                                {activeTab === "login"
                                                    ? "Fresh coffee, warm tables, one simple account."
                                                    : "Join a community that celebrates great food and good company."}
                                            </h2>
                                            <div className="my-6 h-0.5 w-10 bg-amber-200" />
                                            <p className="max-w-xs text-sm leading-6 text-white/85">
                                                {activeTab === "login"
                                                    ? "Manage bookings, chat with the cafe, and keep your favorite orders close."
                                                    : "Create your account to book tables, manage visits, and save your favourite orders."}
                                            </p>
                                        </div>
                                        <div className="relative flex items-center gap-4 rounded-2xl border border-white/20 bg-white/10 p-4 text-sm text-white/85 backdrop-blur-md">
                                            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-white/15 text-white">
                                                <CalendarDays className="h-6 w-6" strokeWidth={1.8} />
                                            </div>
                                            <div>
                                                <div className="font-semibold text-white">{activeTab === "login" ? "Today at BrewCraft" : "More than a meal"}</div>
                                                <div className="mt-1 leading-5">{activeTab === "login" ? "Reserve faster and come back to your saved details anytime." : "Join BrewCraft and unlock a world of memorable experiences."}</div>
                                            </div>
                                        </div>
                                    </aside>

                                    <section className="auth-form-panel relative flex p-6 sm:p-8 md:items-center">
                                        <div className="mx-auto w-full max-w-[540px]">
                                        <DialogHeader className="pr-10 text-left">
                                            <DialogTitle className="font-serif text-3xl font-semibold leading-tight text-[var(--color-text)] sm:text-4xl">
                                                {activeTab === "login" ? "Welcome back" : "Create your account"}
                                            </DialogTitle>
                                            <DialogDescription className="mt-2 text-sm text-[var(--color-text-muted)] sm:text-base">
                                                {activeTab === "login"
                                                    ? "Sign in to continue your BrewCraft experience."
                                                    : "Join BrewCraft to book tables and manage your visits."}
                                            </DialogDescription>
                                        </DialogHeader>
                                    {/* Tab Buttons */}
                                    <div className="auth-tab-list mb-6 mt-6 grid grid-cols-2 overflow-hidden rounded-xl" role="tablist" aria-label="Account access">
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={activeTab === "login"}
                                            className={`auth-tab min-h-[52px] whitespace-nowrap px-4 py-3 text-sm ${activeTab === "login"
                                                ? "auth-tab-active"
                                                : ""
                                                }`}
                                            onClick={() => setActiveTab("login")}
                                        >
                                            <span className="flex items-center justify-center gap-2"><LogIn className="h-4 w-4" />Login</span>
                                        </button>
                                        <button
                                            type="button"
                                            role="tab"
                                            aria-selected={activeTab === "register"}
                                            className={`auth-tab min-h-[52px] whitespace-nowrap px-4 py-3 text-sm ${activeTab === "register"
                                                ? "auth-tab-active"
                                                : ""
                                                }`}
                                            onClick={() => setActiveTab("register")}
                                        >
                                            <span className="flex items-center justify-center gap-2"><UserPlus className="h-4 w-4" />Register</span>
                                        </button>
                                    </div>

                                    {activeTab === "login" && (
                                        <form className="space-y-4" onSubmit={onSubmitLogin}>
                                            {/* Username Field */}
                                            <div>
                                                <label htmlFor="username" className="auth-label block text-sm mb-1.5">
                                                    Username
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                        <User className="auth-icon h-4 w-4" />
                                                    </div>
                                                    <input
                                                        type="text"
                                                        id="username"
                                                        name="username"
                                                        autoComplete="username"
                                                        required
                                                        className="auth-input h-[52px] w-full pl-11 pr-4 text-sm placeholder:text-slate-400"
                                                        placeholder="Enter your email"
                                                        value={username}
                                                        onChange={(event) => setUsername(event.target.value)}
                                                    />
                                                </div>
                                            </div>

                                            {/* Password Field */}
                                            <div>
                                                <label htmlFor="password" className="auth-label block text-sm mb-1.5">
                                                    Password
                                                </label>
                                                <div className="relative">
                                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                        <Lock className="auth-icon h-4 w-4" />
                                                    </div>
                                                    <input
                                                        type={showPassword ? "text" : "password"}
                                                        id="password"
                                                        name="password"
                                                        autoComplete="current-password"
                                                        required
                                                        className="auth-input h-[52px] w-full pl-11 pr-11 text-sm placeholder:text-slate-400"
                                                        placeholder="Enter your password"
                                                        value={password}
                                                        onChange={(event) => setPassword(event.target.value)}
                                                    />
                                                    <button
                                                        type="button"
                                                        aria-label={showPassword ? "Hide password" : "Show password"}
                                                        onClick={() => setShowPassword(!showPassword)}
                                                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2"
                                                    >
                                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                    </button>
                                                </div>
                                            </div>

                                            {/* Forgot Password */}
                                            <div className="flex justify-end">
                                                <button type="button" className="auth-link text-xs">
                                                    Forgot password?
                                                </button>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="btn-primary h-[52px] w-full font-semibold disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        Signing in...
                                                    </span>
                                                ) : <span className="flex items-center justify-center gap-2">Sign In <ArrowRight className="h-4 w-4" /></span>}
                                            </Button>
                                            <p className="flex items-center justify-center gap-1.5 pt-1 text-xs text-[var(--color-text-muted)]">
                                                <ShieldCheck className="h-3.5 w-3.5 text-[var(--color-brand-600)]" />
                                                Secure account access
                                            </p>
                                        </form>
                                    )}

                                    {activeTab === "register" && (
                                        <form className="space-y-[18px]" onSubmit={onSubmit}>
                                            {/* Name and Email in 2 columns */}
                                            <div className="grid gap-[18px] sm:grid-cols-2">
                                                {/* Name Field */}
                                                <div>
                                                    <label htmlFor="name" className="auth-label block text-sm mb-1.5">
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="auth-icon h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="name"
                                                        className="auth-input h-[52px] w-full pl-10 pr-3 text-sm placeholder:text-slate-400"
                                                            placeholder="Your name"
                                                            value={name}
                                                            onChange={(event) => setName(event.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Username Field */}
                                                <div>
                                                    <label htmlFor="reg-username" className="auth-label block text-sm mb-1.5">
                                                        Username
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <User className="auth-icon h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="text"
                                                            id="reg-username"
                                                        className="auth-input h-[52px] w-full pl-10 pr-3 text-sm placeholder:text-slate-400"
                                                        placeholder="Sign in with email"
                                                            value={username}
                                                            onChange={(event) => setUsername(event.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Email and Phone in 2 columns */}
                                            <div className="grid gap-[18px] sm:grid-cols-2">
                                                {/* Email Field */}
                                                <div>
                                                    <label htmlFor="email" className="auth-label block text-sm mb-1.5">
                                                        Email Address
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Mail className="auth-icon h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            id="email"
                                                        className="auth-input h-[52px] w-full pl-10 pr-3 text-sm placeholder:text-slate-400"
                                                            placeholder="Enter email"
                                                            value={email}
                                                            onChange={(event) => setEmail(event.target.value)}
                                                        />
                                                    </div>
                                                </div>

                                                {/* Phone Number Field */}
                                                <div>
                                                    <label htmlFor="phoneNumber" className="auth-label block text-sm mb-1.5">
                                                        Phone Number
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Phone className="auth-icon h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type="tel"
                                                            id="phoneNumber"
                                                        className="auth-input h-[52px] w-full pl-10 pr-3 text-sm placeholder:text-slate-400"
                                                            placeholder="0123456789"
                                                            value={phoneNumber}
                                                            onChange={(event) => setPhoneNumber(event.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Password Field */}
                                            <div>
                                                <div>
                                                    <label htmlFor="reg-password" className="auth-label block text-sm mb-1.5">
                                                        Password
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                                            <Lock className="auth-icon h-4 w-4" />
                                                        </div>
                                                        <input
                                                            type={showPassword ? "text" : "password"}
                                                            id="reg-password"
                                                            name="new-password"
                                                            autoComplete="new-password"
                                                            required
                                                            className="auth-input h-[52px] w-full pl-10 pr-10 text-sm placeholder:text-slate-400"
                                                            placeholder="Password"
                                                            value={password}
                                                            onChange={(event) => setPassword(event.target.value)}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() => setShowPassword(!showPassword)}
                                                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 transition-colors hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2"
                                                        >
                                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Password Requirements */}
                                            <div className="auth-requirements rounded-xl p-3">
                                                <p className="mb-2 text-xs font-semibold text-[var(--color-text-muted)]">Password requirements:</p>
                                                <div className="grid gap-x-3 gap-y-1 sm:grid-cols-2 md:grid-cols-3">
                                                    {passwordRequirements.map((req, index) => {
                                                        const isValid = req.test(password);
                                                        return (
                                                            <div key={index} className="flex items-center gap-1.5">
                                                                {isValid ? (
                                                                    <Check className="h-3 w-3 shrink-0 text-[var(--color-success)]" />
                                                                ) : (
                                                                    <X className="h-3 w-3 shrink-0 text-slate-300" />
                                                                )}
                                                                <span className={`text-xs ${isValid ? 'text-[var(--color-success)]' : 'text-slate-500'}`}>
                                                                    {req.label}
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <Button
                                                type="submit"
                                                disabled={loading}
                                                className="btn-primary h-[52px] w-full font-semibold disabled:opacity-50"
                                            >
                                                {loading ? (
                                                    <span className="flex items-center justify-center gap-2">
                                                        <LoaderCircle className="h-4 w-4 animate-spin" />
                                                        Creating...
                                                    </span>
                                                ) : <span className="flex items-center justify-center gap-2">Create Account <ArrowRight className="h-4 w-4" /></span>}
                                            </Button>
                                        </form>
                                    )}
                                        </div>
                                    </section>
                                </div>
                            </DialogContent>
                        </Dialog>
                    )}
                    <button
                        type="button"
                        className="mobile-menu-trigger lg:hidden"
                        aria-label="Toggle navigation menu"
                        aria-expanded={mobileMenuOpen}
                        onClick={() => setMobileMenuOpen((open) => !open)}
                    >
                        <MenuIcon className="h-6 w-6" />
                    </button>
                </div>

                {mobileMenuOpen && (
                    <div className="mobile-nav-panel lg:hidden">
                        <Link to="/" className="mobile-nav-link" onClick={closeMenus}>Home</Link>
                        <Link to="/menu" className="mobile-nav-link" onClick={closeMenus}>Menu</Link>
                        <Link to="/booking" className="mobile-nav-link" onClick={closeMenus}>Reservation</Link>
                        {user && <Link to="/my-bookings" className="mobile-nav-link" onClick={closeMenus}>My Bookings</Link>}
                        {!user && <Link to="/#about" className="mobile-nav-link" onClick={closeMenus}>About</Link>}
                        {!user && <Link to="/contact-us" className="mobile-nav-link" onClick={closeMenus}>Contact</Link>}
                        {user && (
                            <div className="mobile-account-actions">
                                <button type="button" onClick={onUserProfile}>
                                    <UserCircle className="h-4 w-4" />
                                    Profile
                                </button>
                                <Link to="/my-favourites" className="mobile-nav-link" onClick={closeMenus}>
                                    <Heart className="h-4 w-4" />
                                    My Favourites
                                </Link>
                                <Link to="/user-profile#settings" className="mobile-nav-link" onClick={closeMenus}>
                                    <Settings className="h-4 w-4" />
                                    Settings
                                </Link>
                                <button type="button" onClick={onLogout}>
                                    <LogOut className="h-4 w-4" />
                                    Logout
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </nav>
        </header>
    );
};

export default Header;
