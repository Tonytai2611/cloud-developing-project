pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify Environment') {
            steps {
                sh 'java -version'
                sh 'git --version'
                sh 'ls -la'
            }
        }
    }

    post {
        success {
            echo 'BrewCraft pipeline passed'
        }
        failure {
            echo 'BrewCraft pipeline failed'
        }
    }
}
