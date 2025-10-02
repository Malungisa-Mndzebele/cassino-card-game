# GitHub Secrets Setup for CI/CD Deployment

To enable automated deployment to your Spaceship server, you need to add the following secrets to your GitHub repository.

## Required Secrets

Go to your GitHub repository → Settings → Secrets and variables → Actions → New repository secret

### 1. FTP_USERNAME
- **Name**: `FTP_USERNAME`
- **Value**: `cassino@khasinogaming.com`

### 2. FTP_PASSWORD
- **Name**: `FTP_PASSWORD`
- **Value**: `@QWERTYasd`

### Optional (If SSH is enabled)

### 3. SSH_USERNAME
- **Name**: `SSH_USERNAME`
- **Value**: `cassino@khasinogaming.com`

### 4. SSH_PASSWORD
- **Name**: `SSH_PASSWORD`
- **Value**: `@QWERTYasd`

## How to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** tab
3. In the left sidebar, click **Secrets and variables** → **Actions**
4. Click **New repository secret**
5. Enter the **Name** (e.g., `FTP_USERNAME`)
6. Enter the **Value** (e.g., `cassino@khasinogaming.com`)
7. Click **Add secret**
8. Repeat for each secret

## Security Notes

- ✅ Secrets are encrypted by GitHub
- ✅ They are not visible after creation
- ✅ They are only accessible during workflow runs
- ⚠️  Never commit actual secrets to your repository
- ⚠️  Use secrets for all sensitive data (passwords, API keys, etc.)

## Workflow Triggers

The deployment workflow will run automatically when:
- You push changes to the `master` or `main` branch
- Changes are made to the `backend/` directory
- You manually trigger it from the Actions tab

## Manual Trigger

1. Go to **Actions** tab in your repository
2. Select **Deploy Backend to Spaceship Server** workflow
3. Click **Run workflow** button
4. Select the branch (usually `master`)
5. Click **Run workflow**

## Post-Deployment Steps

After GitHub Actions uploads the files, you still need to:

1. SSH into your server:
   ```bash
   ssh cassino@khasinogaming.com
   ```

2. Navigate to deployment directory:
   ```bash
   cd /home/mawdqtvped/khasinogaming.com/cassino
   ```

3. Run deployment script (first time only):
   ```bash
   chmod +x deploy_to_spaceship.sh start_server.sh
   ./deploy_to_spaceship.sh
   ```

4. Restart server:
   ```bash
   pkill -f "python start_production.py"
   nohup python start_production.py > server.log 2>&1 &
   ```

## Alternative: Full SSH Automation

If SSH is enabled on your Spaceship server, you can enable full automation:

1. Edit `.github/workflows/deploy-backend.yml`
2. Find the "Deploy via SSH" step
3. Change `if: false` to `if: true`
4. This will automatically restart the server after deployment

## Troubleshooting

### FTP Upload Fails
- Verify FTP credentials are correct in GitHub Secrets
- Check that server28.shared.spaceship.host is accessible
- Verify the server path is correct

### SSH Connection Fails
- Verify SSH is enabled on your Spaceship account
- Check SSH credentials in GitHub Secrets
- Test SSH connection manually first

### Permission Denied
- Ensure the target directory exists on the server
- Check file permissions on the server
- Verify your FTP user has write access to the directory

## Testing the Workflow

1. Make a small change to a backend file
2. Commit and push:
   ```bash
   git add backend/README.md
   git commit -m "Test deployment workflow"
   git push origin master
   ```
3. Go to **Actions** tab on GitHub
4. Watch the workflow run
5. Check the logs for any errors

## Monitoring Deployments

- Go to **Actions** tab in your GitHub repository
- Click on any workflow run to see detailed logs
- Check for success/failure status
- Review deployment summary at the end

---

**Note**: The current workflow uploads files via FTP. For full automation including server restart, SSH access is required. If SSH is not available, manual server restart is needed after each deployment.

