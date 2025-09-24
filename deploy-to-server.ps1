# Casino Card Game Deployment Script
# Run this script to deploy to khasinogaming.com

$ErrorActionPreference = "Stop"

$ServerHost = "khasinogaming.com"
$ServerUser = "cassino"
$ServerPath = "/home/mawdqtvped/khasinogaming.com/cassino"

Write-Host "🚀 Deploying Casino Card Game to khasinogaming.com" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host

Write-Host "📋 Server Information:" -ForegroundColor Yellow
Write-Host "   Host: $ServerHost"
Write-Host "   User: $ServerUser"
Write-Host "   Path: $ServerPath"
Write-Host

# Test SSH connection
Write-Host "🔑 Testing SSH connection..." -ForegroundColor Yellow
try {
    $sshTest = ssh "${ServerUser}@${ServerHost}" "echo '✅ SSH connection successful!'" 2>&1
    if ($LASTEXITCODE -ne 0) { throw $sshTest }
    Write-Host $sshTest -ForegroundColor Green
}
catch {
    Write-Host "❌ SSH connection failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host "Please make sure you can connect via SSH first." -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host
Write-Host "📂 Deploying code..." -ForegroundColor Yellow
Write-Host

# Deploy using SSH
$deployScript = @'
#!/bin/bash
set -e

echo "🚀 Starting deployment..."

# Navigate to project directory
if [ ! -d "/home/mawdqtvped/khasinogaming.com/cassino" ]; then
    echo "❌ Project directory not found. Creating it..."
    mkdir -p /home/mawdqtvped/khasinogaming.com/cassino
    cd /home/mawdqtvped/khasinogaming.com/cassino
    git clone https://github.com/Malungisa-Mndzebele/cassino-card-game.git .
else
    cd /home/mawdqtvped/khasinogaming.com/cassino
fi

# Pull latest changes
echo "📥 Pulling latest changes..."
git pull origin master

# Install dependencies
echo "📦 Installing dependencies..."
npm run install:all

# Stop existing services
echo "🛑 Stopping existing services..."
pkill -f "node frontend/production-server.js" || true
pkill -f "python.*start_production.py" || true

# Wait for processes to stop
sleep 5

# Start backend
echo "🚀 Starting backend server..."
cd backend
nohup python3 start_production.py > backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "⏳ Waiting for backend to start..."
for i in {1..12}; do
    sleep 5
    if curl -s http://localhost:8000/health > /dev/null; then
        echo "✅ Backend started successfully"
        break
    fi
    if [ $i -eq 12 ]; then
        echo "❌ Backend failed to start. Logs:"
        cat backend/backend.log
        exit 1
    fi
    echo "⏳ Still waiting for backend... (attempt $i/12)"
done

# Start frontend
echo "🎨 Starting frontend server..."
nohup node frontend/production-server.js > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
echo "⏳ Waiting for frontend to start..."
for i in {1..12}; do
    sleep 5
    if curl -s http://localhost:3000 > /dev/null; then
        echo "✅ Frontend started successfully"
        break
    fi
    if [ $i -eq 12 ]; then
        echo "❌ Frontend failed to start. Logs:"
        cat frontend.log
        exit 1
    fi
    echo "⏳ Still waiting for frontend... (attempt $i/12)"
done

# Final verification
echo "🔍 Verifying services..."

# Check backend health
BACKEND_HEALTH=$(curl -s http://localhost:8000/health)
if [[ $BACKEND_HEALTH == *"healthy"* ]]; then
    echo "✅ Backend health check passed"
else
    echo "❌ Backend health check failed:"
    echo "$BACKEND_HEALTH"
    echo "Backend logs:"
    cat backend/backend.log
    exit 1
fi

# Check frontend
if curl -s http://localhost:3000 > /dev/null; then
    echo "✅ Frontend check passed"
else
    echo "❌ Frontend check failed. Logs:"
    cat frontend.log
    exit 1
fi

# Check processes
if ps -p $BACKEND_PID > /dev/null; then
    echo "✅ Backend process running (PID: $BACKEND_PID)"
else
    echo "❌ Backend process not running"
    exit 1
fi

if ps -p $FRONTEND_PID > /dev/null; then
    echo "✅ Frontend process running (PID: $FRONTEND_PID)"
else
    echo "❌ Frontend process not running"
    exit 1
fi

echo "🎉 Deployment completed successfully!"
echo "🌐 Game is now live at: https://khasinogaming.com/cassino/"
'@

try {
    # Save the script to a temporary file
    $tempScript = [System.IO.Path]::GetTempFileName()
    $deployScript | Out-File -FilePath $tempScript -Encoding UTF8

    # Copy the script to the server and execute it
    Write-Host "📤 Uploading deployment script..." -ForegroundColor Yellow
    scp $tempScript "${ServerUser}@${ServerHost}:deploy.sh"
    
    Write-Host "🔧 Running deployment script..." -ForegroundColor Yellow
    $deployment = ssh "${ServerUser}@${ServerHost}" "chmod +x deploy.sh && ./deploy.sh && rm deploy.sh" 2>&1
    Write-Host $deployment
    
    if ($LASTEXITCODE -ne 0) { throw $deployment }
    
    Write-Host
    Write-Host "✅ Deployment successful!" -ForegroundColor Green
    Write-Host "🌐 Your game is now live at: https://khasinogaming.com/cassino/" -ForegroundColor Cyan
}
catch {
    Write-Host
    Write-Host "❌ Deployment failed!" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
finally {
    # Clean up temporary file
    if (Test-Path $tempScript) {
        Remove-Item $tempScript -Force
    }
}

Write-Host
Read-Host "Press Enter to exit"