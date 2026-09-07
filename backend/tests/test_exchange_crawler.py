import pytest
from backend.scraper.exchange_crawler import ExchangeCrawler

def test_address_validation():
    valid_addr = "0x" + "a" * 40
    invalid_addr = "0xinvalid"
    short_addr = "0x12345"

    assert ExchangeCrawler._validate_eth_address(valid_addr) is True
    assert ExchangeCrawler._validate_eth_address(invalid_addr) is False
    assert ExchangeCrawler._validate_eth_address(short_addr) is False

def test_crawler_initialization():
    crawler = ExchangeCrawler(serpapi_key="test_key")
    assert crawler is not None
    assert len(crawler.KNOWN_EXCHANGES) >= 10
