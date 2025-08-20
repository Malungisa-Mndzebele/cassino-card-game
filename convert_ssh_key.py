#!/usr/bin/env python3
"""
Convert PuTTY format SSH key to OpenSSH format
"""

import base64
import struct

def convert_putty_to_openssh(putty_key_content):
    """Convert PuTTY private key to OpenSSH format"""
    
    # Parse the PuTTY key content
    lines = putty_key_content.strip().split('\n')
    
    # Extract the private key data
    private_lines = []
    in_private = False
    
    for line in lines:
        if line.startswith('Private-Lines:'):
            in_private = True
            continue
        elif line.startswith('Private-MAC:'):
            break
        elif in_private:
            private_lines.append(line)
    
    # Decode the private key
    private_data = base64.b64decode(''.join(private_lines))
    
    # Parse the private key structure
    # PuTTY format: type, encryption, comment, public_key, private_key
    offset = 0
    
    # Skip type (ssh-rsa)
    type_len = struct.unpack('>I', private_data[offset:offset+4])[0]
    offset += 4 + type_len
    
    # Skip encryption (aes256-cbc)
    enc_len = struct.unpack('>I', private_data[offset:offset+4])[0]
    offset += 4 + enc_len
    
    # Skip comment
    comment_len = struct.unpack('>I', private_data[offset:offset+4])[0]
    offset += 4 + comment_len
    
    # Skip public key
    pub_len = struct.unpack('>I', private_data[offset:offset+4])[0]
    offset += 4 + pub_len
    
    # Get private key
    priv_len = struct.unpack('>I', private_data[offset:offset+4])[0]
    offset += 4
    private_key = private_data[offset:offset+priv_len]
    
    # Convert to OpenSSH format
    openssh_key = f"""-----BEGIN OPENSSH PRIVATE KEY-----
{base64.b64encode(private_key).decode()}
-----END OPENSSH PRIVATE KEY-----"""
    
    return openssh_key

# Your PuTTY key content
putty_key = """PuTTY-User-Key-File-3: ssh-rsa
Encryption: aes256-cbc
Comment: 
Public-Lines: 6
AAAAB3NzaC1yc2EAAAADAQABAAABAQCjUhWpC4gn9SbKCsd5Eh6fm9J5dRNboWtA
V5KrDAZz/074Kf1NW7IlnsVUMCK6huGDzrXPR4pQa0psxkACP5SDlWDtLQWFCQSi
sdJ9v98QZaoiUtrkgzRHAMoxfeBq7t7cVEHZqI0+mh9kxsbNDII7JPlKUr/p2QR3
h+Za5Mrr8YqfVJuV/0vmbEFwi8VN/UgFiePLL/Xgwdrl+bMXQi7ftPfCeviVylTU
NjOSQd+bGQ2Kl5jqi/7boPAHp7gggvvf6HwVSTecqRlJ1Z8CmG/PwJIrgFXG2OY8
1K5BueupN8if6lLYlAgGwF+kKMItG9JbWh5A9Ep55SchO0dmWfFL
Key-Derivation: Argon2id
Argon2-Memory: 8192
Argon2-Passes: 13
Argon2-Parallelism: 1
Argon2-Salt: dcf3e6f932c913bbba6f0c39a1d7b20d
Private-Lines: 14
cvA7Xro1p6KUfxP9vn2Mfd/1cdFYRk6O3zrIhsSBaSXBFZlQbCx9cmuMsyMR6zID
BLkzUrNt5qFpdI8M6i4qUr+TIey6zmVQpvResa10rQgHZSY1sUZIwKuqsRY+FAc0
uPEALntEkoKtXYONNNgPrKmaMVEMEAcf9KlmvIhz9kSfb8G57m0CI7RZHT1j+V5f
G1P28DmWBdVhtVx2qfkNJnGJ+0dJHcWcvhn1LKr7fBSeRy0HPKNtJWUuZQ+1+3oN
+Kn/s92F72BSvHaF4PKX/VTQoRrKl791W9IVOHBhEYJZpqzqr4RIUi7Gwr1eWiph
AB1DH3Nmj+5bvhdfC1/FrHkg7TvpP2TRs58a30OM89SP/OTjocT2F0aVn6r58Wri
CfKhWOFOB4tfGoKc7G8y3orDyxfrZajSWh020Q5OzoRo+47Pb/DBfvu3lpPuiZRZ
k/RxrUwhbK51AYLBtDJGe1eSG445zEzD/UPyV7wvTI0hNwLPB3/ph7Geo/baLZej
foNBdnm3TCHF6OtTBbqbQkqpcphuYkfb7eXHkzHJBG6pZX7UDkqI5mlMnvr6hiqL
LvCg1f+J2/LR5YZf9DLqOqV35cihmlU4uYyKXrYeXtZ+DhKpqJsqDzSZ4S3DoebC
+Hkq2AL/UEoXH715Pjr71VNYWhHeu44duD0PEmz9mDygyMqy6ANb3pFGwlBuyehY
twke2hUF1byrG7JpPDLxAzqmwF6878bdQY2OU/ktfAlun+9XeVxFgIYPaxI558cv
cK/jZrtQTV4I0g5y1Jysu58QdlpSo0VMXDuRIum/9nT+3IusRjKGBTTD/zstwSlR
8B/X8/odEzd7lFvyksnrla9gbW0lJWKevfGTKc/Qr6UxfKiGJXP8dXo5VoNT2hcz
Private-MAC: 825e90f1cfc5aa8781de6b5b2b847576be30dc9a8f190e14fee6bc38914e3f31"""

try:
    openssh_key = convert_putty_to_openssh(putty_key)
    print("✅ Converted SSH key to OpenSSH format:")
    print("=" * 50)
    print(openssh_key)
    print("=" * 50)
    print("\n📋 Copy this key and update your GitHub SSH_PRIVATE_KEY secret!")
    
except Exception as e:
    print(f"❌ Error converting key: {e}")
    print("\n🔧 Alternative: Use PuTTYgen to convert the key")
    print("1. Open PuTTYgen")
    print("2. Load your private key")
    print("3. Go to Conversions > Export OpenSSH key")
    print("4. Save the key and copy it to GitHub secrets")
