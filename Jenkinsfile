pipeline {
    agent any

    tools {
        nodejs 'NodeJS 18'  // Must match the name in Jenkins Tools configuration
    }

    environment {
        VERCEL_TOKEN = credentials('vercel-token')  // You'll add this in Jenkins credentials
        ANTHROPIC_API_KEY = credentials('anthropic-api-key')
    }

    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out code from GitHub...'
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                echo 'Installing npm dependencies...'
                bat 'npm install'  // Use 'bat' for Windows, 'sh' for Linux/Mac
            }
        }

        stage('Build') {
            steps {
                echo 'Building the project...'
                bat 'npm run build'
            }
        }

        stage('Test') {
            steps {
                echo 'Running tests...'
                // Add test commands here if you have tests
                // bat 'npm test'
                echo 'No tests configured yet'
            }
        }

        stage('Deploy to Vercel') {
            steps {
                echo 'Deploying to Vercel...'
                // Install Vercel CLI and deploy
                bat '''
                    npm install -g vercel
                    vercel --prod --token %VERCEL_TOKEN% --yes
                '''
            }
        }
    }

    post {
        success {
            echo 'Pipeline completed successfully! ✅'
            echo 'Application deployed to Vercel'
        }
        failure {
            echo 'Pipeline failed! ❌'
            echo 'Check the logs for errors'
        }
        always {
            echo 'Cleaning up workspace...'
            cleanWs()
        }
    }
}
