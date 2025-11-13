# FTP Deployment Script for Casino Card Game
# Uploads dist/ folder to production server

$ftpServer = "ftp://server28.shared.spaceship.host"
$ftpUsername = "cassino@khasinogaming.com"
$ftpPassword = "@QWERTYasd"
$remotePath = "/cassino"
$localPath = ".\dist"

Write-Host "`n🚀 Starting FTP Deployment" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray

# Function to upload file
function Upload-File {
    param($localFile, $remoteFile)
    
    try {
        $uri = "$ftpServer$remoteFile"
        $webclient = New-Object System.Net.WebClient
        $webclient.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
        $webclient.UploadFile($uri, $localFile)
        Write-Host "  ✅ Uploaded: $remoteFile" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "  ❌ Failed: $remoteFile - $($_.Exception.Message)" -ForegroundColor Red
        return $false
    }
}

# Function to create directory
function Create-FtpDirectory {
    param($directory)
    
    try {
        $uri = "$ftpServer$directory"
        $request = [System.Net.FtpWebRequest]::Create($uri)
        $request.Credentials = New-Object System.Net.NetworkCredential($ftpUsername, $ftpPassword)
        $request.Method = [System.Net.WebRequestMethods+Ftp]::MakeDirectory
        $response = $request.GetResponse()
        $response.Close()
        Write-Host "  📁 Created directory: $directory" -ForegroundColor Yellow
        return $true
    }
    catch {
        # Directory might already exist, that's okay
        return $true
    }
}

# Get all files from dist folder
Write-Host "📦 Scanning dist folder..." -ForegroundColor Cyan
$files = Get-ChildItem -Path $localPath -Recurse -File

$totalFiles = $files.Count
$uploadedFiles = 0
$failedFiles = 0

Write-Host "Found $totalFiles files to upload`n" -ForegroundColor Gray

# Upload each file
foreach ($file in $files) {
    $relativePath = $file.FullName.Substring($localPath.Length).Replace("\", "/")
    $remoteFile = "$remotePath$relativePath"
    
    # Create directory if needed
    $remoteDir = Split-Path $remoteFile -Parent
    if ($remoteDir -ne $remotePath) {
        Create-FtpDirectory $remoteDir | Out-Null
    }
    
    # Upload file
    if (Upload-File $file.FullName $remoteFile) {
        $uploadedFiles++
    }
    else {
        $failedFiles++
    }
}

# Summary
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Gray
Write-Host "📊 Deployment Summary" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Gray
Write-Host "  Total files:    $totalFiles" -ForegroundColor White
Write-Host "  ✅ Uploaded:    $uploadedFiles" -ForegroundColor Green
Write-Host "  ❌ Failed:      $failedFiles" -ForegroundColor Red

if ($failedFiles -eq 0) {
    Write-Host "`n✅ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "🌐 Site: https://khasinogaming.com/cassino/`n" -ForegroundColor Cyan
}
else {
    Write-Host "`n⚠️  Deployment completed with errors" -ForegroundColor Yellow
}
