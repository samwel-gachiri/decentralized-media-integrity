#!/usr/bin/env python3
"""
MeTTa File Loader Utility
Load and validate MeTTa knowledge files
"""

import os
import sys
from pathlib import Path

# Add backend to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.services.metta_service import NewsIntegrityKnowledgeBase

def list_metta_files():
    """List all available MeTTa files"""
    metta_dir = Path(__file__).parent / 'metta'
    
    print("Available MeTTa Files:")
    print("=" * 40)
    
    if not metta_dir.exists():
        print("MeTTa directory not found!")
        return []
    
    metta_files = list(metta_dir.glob('*.metta'))
    
    for i, file_path in enumerate(metta_files, 1):
        file_size = file_path.stat().st_size
        print(f"{i}. {file_path.name} ({file_size} bytes)")
        
        # Show first few lines as preview
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()[:3]
                for line in lines:
                    if line.strip() and not line.strip().startswith(';'):
                        print(f"   Preview: {line.strip()}")
                        break
        except Exception as e:
            print(f"   Error reading file: {e}")
        print()
    
    return metta_files

def validate_metta_file(file_path):
    """Validate a single MeTTa file"""
    print(f" Validating {file_path.name}...")
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Basic syntax validation
        lines = content.split('\n')
        issues = []
        
        for i, line in enumerate(lines, 1):
            line = line.strip()
            if not line or line.startswith(';'):
                continue
                
            # Check for balanced parentheses
            if line.count('(') != line.count(')'):
                issues.append(f"Line {i}: Unbalanced parentheses")
            
            # Check for basic MeTTa syntax
            if line.startswith('(') and not line.endswith(')'):
                issues.append(f"Line {i}: Expression doesn't end with ')'")
        
        if issues:
            print(f"Found {len(issues)} potential issues:")
            for issue in issues[:5]:  # Show first 5 issues
                print(f"     {issue}")
        else:
            print(f"No syntax issues found")
        
        # Try loading with MeTTa
        kb = NewsIntegrityKnowledgeBase()
        kb.metta.run(content)
        print(f"Successfully loaded into MeTTa engine")
        
        return len(issues) == 0
        
    except Exception as e:
        print(f"Error: {str(e)}")
        return False

def show_file_content(file_path):
    """Show the content of a MeTTa file"""
    print(f"Content of {file_path.name}:")
    print("=" * 60)
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        lines = content.split('\n')
        for i, line in enumerate(lines, 1):
            if line.strip():
                print(f"{i:3d}: {line}")
            else:
                print(f"{i:3d}:")
                
    except Exception as e:
        print(f"Error reading file: {e}")

def test_knowledge_loading():
    """Test loading all MeTTa files into knowledge base"""
    print(" Testing Knowledge Base Loading")
    print("=" * 50)
    
    try:
        kb = NewsIntegrityKnowledgeBase()
        state = kb.get_knowledge_base_state()
        
        print("Knowledge Base State:")
        for key, value in state.items():
            print(f"  {key}: {value}")
        
        # Test some basic queries
        print("\n Basic Queries:")
        
        test_queries = [
            "(climate-event-type $type)",
            "(min-trust-score $threshold)",
            "(payout-amount High $amount)",
            "(impact-category $category)"
        ]
        
        for query in test_queries:
            print(f"\nQuery: {query}")
            try:
                results = kb.query_knowledge_base(query)
                if results:
                    for result in results[:3]:  # Show first 3 results
                        print(f"  Result: {result}")
                else:
                    print("  No results")
            except Exception as e:
                print(f"  Error: {e}")
        
        print("\nKnowledge base loading test completed")
        
    except Exception as e:
        print(f"❌ Knowledge base test failed: {e}")

def main():
    """Main function"""
    print("Decentralized News Integrity - MeTTa File Loader")
    print("=" * 60)
    
    while True:
        print("\nChoose an option:")
        print("1. List MeTTa files")
        print("2. Validate all files")
        print("3. Show file content")
        print("4. Test knowledge loading")
        print("5. Exit")
        
        choice = input("\nEnter choice (1-5): ").strip()
        
        if choice == "1":
            list_metta_files()
            
        elif choice == "2":
            files = list_metta_files()
            print("\n Validating all MeTTa files...")
            valid_count = 0
            for file_path in files:
                if validate_metta_file(file_path):
                    valid_count += 1
                print()
            print(f"{valid_count}/{len(files)} files are valid")
            
        elif choice == "3":
            files = list_metta_files()
            if files:
                try:
                    file_num = int(input(f"Enter file number (1-{len(files)}): "))
                    if 1 <= file_num <= len(files):
                        show_file_content(files[file_num - 1])
                    else:
                        print("Invalid file number")
                except ValueError:
                    print("Please enter a valid number")
            
        elif choice == "4":
            test_knowledge_loading()
            
        elif choice == "5":
            print("Goodbye!")
            break
            
        else:
            print("Invalid choice. Please try again.")

if __name__ == "__main__":
    main()