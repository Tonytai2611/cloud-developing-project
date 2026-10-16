pipeline {
    agent { label 'brewcraft-ci' }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout()
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Verify tools') {
            steps {
                sh 'java -version'
                sh 'git --version'
                sh 'node --version'
                sh 'npm --version'
            }
        }

        stage('Install dependencies') {
            steps {
                sh 'npm ci'
            }
        }

        stage('Frontend tests') {
            steps {
                sh 'CI=true npm test -- --watchAll=false'
            }
        }

        stage('Frontend build') {
            steps {
                sh 'npm run build'
            }
        }

        stage('Backend syntax') {
            steps {
                sh 'node --check server/index.js'
            }
        }
    }

    post {
        success {
            echo 'BrewCraft CI passed'
        }
        failure {
            echo 'BrewCraft CI failed; no deployment was attempted'
        }
    }
}
