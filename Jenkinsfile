pipeline { agent { label 'rootless-user-agent' }

environment {
    DOCKER_HOST = 'unix:///run/user/1001/docker.sock'
    PATH = "/home/user/.nvm/versions/node/v26.13.1/bin:${env.PATH}"
}

options {
    timestamps()
    skipDefaultCheckout(true)
}

stages {

    stage('Checkout') {
        steps {
            checkout scm
        }
    }

    stage('Frontend CI') {
        steps {
            dir('frontend') {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm run build'
            }
        }
    }

    stage('Backend CI') {
        steps {
            dir('backend') {
                sh 'npm ci'
                sh 'npm run lint'
                sh 'npm test'
            }
        }
    }

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

    stage('Database Validation') {
        steps {
            sh '''
                test -f database/schema.sql
                test -f database/seed.sql
                docker compose config -q
            '''
        }
    }
}

post {
    success {
        echo 'CI SUCCESS: All checks passed!'
    }

    failure {
        echo 'CI FAILED: Check Console Output.'
    }

    always {
        echo 'CI pipeline completed.'
    }
}


}

