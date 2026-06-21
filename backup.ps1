$DateStr = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$BackupDir = "backups\source"
$ZipName = "mpsms_source_$DateStr.zip"
$ZipPath = Join-Path $BackupDir $ZipName

Write-Host "Creating backup archive: $ZipName..."

# Exclude directories that shouldn't be backed up
$Excludes = @("node_modules", ".next", "dist", "build", ".vercel", "backups", ".git")

# We compress everything in the current directory except the excludes
Compress-Archive -Path ".\*" -DestinationPath $ZipPath -Update

# Need to manually strip out excluded folders if Compress-Archive doesn't support exclusions natively 
# Actually, Compress-Archive doesn't natively exclude well, so let's do a more robust approach:
$TempDir = Join-Path $env:TEMP "mpsms_backup_$DateStr"
New-Item -ItemType Directory -Force -Path $TempDir | Out-Null

Write-Host "Copying files to temporary staging area..."
# Copy everything except excludes
Get-ChildItem -Path . -Exclude $Excludes | Copy-Item -Destination $TempDir -Recurse -Force

Write-Host "Compressing archive..."
Compress-Archive -Path "$TempDir\*" -DestinationPath $ZipPath -Force

Write-Host "Cleaning up staging area..."
Remove-Item -Path $TempDir -Recurse -Force

Write-Host "Backup completed successfully: $ZipPath"
