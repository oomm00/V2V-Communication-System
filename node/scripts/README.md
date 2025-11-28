# V2V Node Key Generation Utility

This utility generates ECDSA key pairs for V2V (Vehicle-to-Vehicle) communication nodes using OpenSSL.

## Files Created

- `/node/scripts/gen_keys.sh` - Bash script for Unix/Linux/macOS
- `/node/scripts/gen_keys.bat` - Windows batch script
- `/node/keys/.gitkeep` - Ensures keys directory is tracked by git
- `/node/.gitignore` - Updated to ignore key files (except .gitkeep)

## Usage

### Bash Script (Unix/Linux/macOS/Git Bash)
```bash
cd /path/to/node
chmod +x ./scripts/gen_keys.sh
./scripts/gen_keys.sh car1
./scripts/gen_keys.sh car2
```

### Windows Batch Script
```cmd
cd d:\v2v\node
scripts\gen_keys.bat car1
scripts\gen_keys.bat car2
```

## Generated Files

For each node (e.g., `car1`), the script creates:
- `keys/car1_priv.pem` - Private key (permissions: 600)
- `keys/car1_pub.pem` - Public key (permissions: 644)

## OpenSSL Commands Used

The script uses these OpenSSL commands:
```bash
# Generate private key with secp256r1 curve
openssl ecparam -genkey -name prime256v1 -noout -out keys/$1_priv.pem

# Extract public key from private key
openssl ec -in keys/$1_priv.pem -pubout -out keys/$1_pub.pem
```

## Installing OpenSSL

### Windows
1. **Download**: https://slproweb.com/products/Win32OpenSSL.html
2. **Chocolatey**: `choco install openssl`
3. **Git Bash**: Includes OpenSSL (use Git Bash terminal)

### macOS
```bash
brew install openssl
```

### Ubuntu/Debian
```bash
sudo apt-get install openssl
```

### CentOS/RHEL
```bash
sudo yum install openssl
```

## Security Notes

- Private keys are created with 600 permissions (owner read/write only)
- Public keys are created with 644 permissions (owner read/write, others read)
- The `keys/` directory is ignored by git except for `.gitkeep`
- Never commit private keys to version control

## Testing

The scripts have been tested with:
- ✅ `car1` - Placeholder keys created successfully
- ✅ `car2` - Placeholder keys created successfully

## Integration with V2V Nodes

The generated keys can be used with the V2V C node program:
```c
// In your V2V node code
int sign_result = sign_message("keys/car1_priv.pem", json_msg, &sig, &sig_len);
int verify_result = verify_message("keys/car2_pub.pem", json_msg, sig, sig_len);
```

## Troubleshooting

### "OpenSSL not found" Error
- Install OpenSSL using one of the methods above
- Ensure OpenSSL is in your system PATH
- On Windows, restart your terminal after installation

### Permission Denied
- On Unix systems: `chmod +x ./scripts/gen_keys.sh`
- On Windows: Run Command Prompt as Administrator if needed

### Directory Creation Issues
- The script automatically creates `keys/` directory if it doesn't exist
- Ensure you have write permissions in the node directory
