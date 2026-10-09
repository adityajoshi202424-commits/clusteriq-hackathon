import os
import re
import sys

def run_smoke_test():
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    directories_to_scan = ["engine", "trends", "destination", "benchmark", "extract"]
    
    # Hardcoded strings that should NOT be in the python files (they should be in config/yaml)
    forbidden_strings = [
        "welcomhotel", "jw marriott", "savoy", "jaypee", 
        "nainital", "bhimtal", "haldwani", "mussoorie", 
        "makemytrip", "agoda", "tripadvisor"
    ]
    
    violations = 0
    
    for d in directories_to_scan:
        dir_path = os.path.join(project_root, d)
        if not os.path.exists(dir_path):
            continue
            
        for root, _, files in os.walk(dir_path):
            for file in files:
                if file.endswith(".py"):
                    file_path = os.path.join(root, file)
                    with open(file_path, "r", encoding="utf-8") as f:
                        content = f.read().lower()
                        
                        # Strip out comments and strings maybe? 
                        # For a strict hackathon test, just raw scan.
                        for forbidden in forbidden_strings:
                            # If it's found, print violation
                            if forbidden in content:
                                # We allow comments, but let's be strict for the hackathon
                                print(f"❌ SMOKE TEST FAILED: Hardcoded string '{forbidden}' found in {file_path}")
                                violations += 1
                                
    if violations > 0:
        print(f"\n🚨 DEPLOYMENT HALTED. Found {violations} hardcoding violations.")
        print("RULE 1: ZERO STRING HARDCODING. Move these to config/cluster.yaml or config/sources.yaml!")
        sys.exit(1)
    else:
        print("✅ SMOKE TEST PASSED: Zero hardcoded regional/property strings detected in core logic modules.")
        sys.exit(0)

if __name__ == "__main__":
    run_smoke_test()
