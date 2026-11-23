
pipeline {
    agent {
        label 'rootless-user-agent'
    }

    environment {
        DOCKER_HOST = 'unix:///run/user/1001/docker.sock'
        PATH = "/home/user/.nvm/versions/node/v26.13.1/bin:${env.PATH}"
    }

    options {
        timestamps()
        skipDefaultCheckout(true)
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        // ==========================================
        // 1. CHECKOUT
        // ==========================================

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        // ==========================================
        // 2. INJECT JENKINS SECRET FILES
        // ==========================================

        stage('Prepare Environment') {
            steps {
                withCredentials([
                    file(
                        credentialsId: 'project-env',
                        variable: 'PROJECT_ENV_FILE'
                    ),
                    file(
                        credentialsId: 'frontend-env',
                        variable: 'FRONTEND_ENV_FILE'
                    ),
                    file(
                        credentialsId: 'backend-env',
                        variable: 'BACKEND_ENV_FILE'
                    )
                ]) {
                    sh '''
                        set +x
                        umask 077

                        install -m 600 "$PROJECT_ENV_FILE" .env
                        install -m 600 "$FRONTEND_ENV_FILE" frontend/.env
                        install -m 600 "$BACKEND_ENV_FILE" backend/.env

                        echo "Environment files prepared successfully."
                    '''
                }
            }
        }

        // ==========================================
        // 3. FRONTEND CI
        // ==========================================

        stage('Frontend CI') {
            steps {
                dir('frontend') {
                    sh '''
                        npm ci

                        echo "Running frontend lint..."
                        npm run lint

                        echo "Building frontend..."
                        npm run build
                    '''
                }
            }
        }

        // ==========================================
        // 4. BACKEND CI
        // ==========================================

        stage('Backend CI') {
            steps {
                dir('backend') {
                    sh '''
                        npm ci

                        echo "Running backend lint..."
                        npm run lint

                        echo "Running backend tests..."
                        npm test
                    '''
                }
            }
        }

        // ==========================================
        // 5. DATABASE VALIDATION
        // ==========================================

        stage('Database Validation') {
            steps {
                sh '''
                    echo "Checking database files..."

                    test -f database/schema.sql
                    test -f database/seed.sql

                    echo "Validating Docker Compose configuration..."

                    docker compose config -q

                    echo "Database configuration validation passed."
                '''
            }
        }

        // ==========================================
        // 6. BUILD DOCKER IMAGES
        // ==========================================

        stage('Build Docker Images') {
            parallel {

                stage('Frontend Image') {
                    steps {
                        sh '''
                            docker build \
                                -t lab-equipment-frontend:ci \
                                ./frontend
                        '''
                    }
                }

                stage('Backend Image') {
                    steps {
                        sh '''
                            docker build \
                                -t lab-equipment-backend:ci \
                                ./backend
                        '''
                    }
                }
            }
        }

        // ==========================================
        // 7. FINAL VALIDATION
        // ==========================================

        stage('Final Validation') {
            steps {
                sh '''
                    echo "Checking generated Docker images..."

                    docker image inspect lab-equipment-frontend:ci
                    docker image inspect lab-equipment-backend:ci

                    echo "All CI validations passed."
                '''
            }
        }
    }

    // ==========================================
    // POST BUILD
    // ==========================================

    post {
        success {
            echo 'CI SUCCESS: All checks passed!'
        }

        failure {
            echo 'CI FAILED: Check Jenkins Console Output.'
        }

        always {
            sh '''
                rm -f .env
                rm -f frontend/.env
                rm -f backend/.env
            '''

            echo 'Temporary environment files cleaned.'
            echo 'CI pipeline completed.'
        }
    }
}
