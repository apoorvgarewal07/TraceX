#!/usr/bin/env python3
"""
Seed Exchange & VASP wallet labels into CryptoFraud Trace database.
"""
import sys
import os

# Add root directory to python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from backend.database.db import init_db
from backend.scraper.exchange_crawler import ExchangeCrawler

def main():
    print("=====================================================")
    print(" CRYPTOFRAUD TRACE - SEEDING EXCHANGE WALLET LABELS  ")
    print("=====================================================")
    init_db()
    
    api_key = os.getenv('SERPAPI_KEY', 'demo_serpapi_key_here')
    crawler = ExchangeCrawler(api_key)
    print("Crawling and inserting known exchange & mixer deposit addresses...")
    count = crawler.seed_wallet_labels()
    print(f"✓ Success: {count} wallet labels indexed in database.")

if __name__ == '__main__':
    main()
