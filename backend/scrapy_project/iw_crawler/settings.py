# Scrapy settings for iw_crawler
BOT_NAME = "iw_crawler"
SPIDER_MODULES = ["iw_crawler.spiders"]
NEWSPIDER_MODULE = "iw_crawler.spiders"
ROBOTSTXT_OBEY = True
DOWNLOAD_DELAY = 0.5
CONCURRENT_REQUESTS_PER_DOMAIN = 4
USER_AGENT = "IntellWeaveBot/0.1 (+https://intellweave.local)"

# Retries and timeouts
RETRY_ENABLED = True
RETRY_TIMES = 2
DOWNLOAD_TIMEOUT = 20

# Pipelines: store raw HTML to S3 and insert parsed rows into Postgres
ITEM_PIPELINES = {
    "iw_crawler.pipelines.StoragePipeline": 300,
}
