#!/usr/bin/env python3
"""
Setup script for AI-powered MeTTa integration
"""

import subprocess
import sys
import os

def run_command(command, cwd=None):
    """Run a command and return success status"""
    try:
        result = subprocess.run(command, shell=True, cwd=cwd, check=True, 
                              capture_output=True, text=True)
        print(f"✅ {command}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ {command}")
        print(f"Error: {e.stderr}")
        return False

def main():
    print(" Setting up AI-powered MeTTa integration...")
    
    # Backend setup
    print("\n Installing backend dependencies...")
    backend_commands = [
        "pip install ipfshttpclient==0.8.0a2",
        "pip install anthropic==0.7.8",
        "pip install metta-python==0.1.0 || echo 'MeTTa Python package not available, using simulation mode'"
    ]
    
    for cmd in backend_commands:
        run_command(cmd, cwd="backend")
    
    # Frontend setup
    print("\n Installing frontend dependencies...")
    frontend_commands = [
        "npm install d3@^7.8.5"
    ]
    
    for cmd in frontend_commands:
        run_command(cmd, cwd="frontend-react")
    
    # Create environment file if it doesn't exist
    print("\n⚙️ Setting up environment...")
    if not os.path.exists("backend/.env"):
        if os.path.exists("backend/.env.example"):
            run_command("cp .env.example .env", cwd="backend")
            print(" Created .env file from template")
            print("⚠️  Please add your ANTHROPIC_API_KEY to backend/.env")
        else:
            print("⚠️  No .env.example found, please create backend/.env manually")
    
    print("\n✅ AI-powered MeTTa setup complete!")
    print("\n Next steps:")
    print("1. Add your Anthropic API key to backend/.env:")
    print("   ANTHROPIC_API_KEY=your_api_key_here")
    print("2. Start the backend server: python backend/main.py")
    print("3. Start the frontend: cd frontend-react && npm run dev")
    print("4. Visit the MeTTa Viewer page to test AI queries")
    
    print("\n Optional: Install IPFS for decentralized storage")
    print("   Visit: https://docs.ipfs.tech/install/")

if __name__ == "__main__":
    main()