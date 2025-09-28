import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY') or 'you-will-never-guess'
    ELASTICSEARCH_HOST = os.environ.get('ELASTICSEARCH_HOST') or 'http://localhost:9200'
    ELASTICSEARCH_DEVICES_INDEX = os.environ.get('ELASTICSEARCH_DEVICES_INDEX') or 'devices_index'
    OPENAI_API_KEY = os.environ.get('OPENAI_API_KEY')
    PYATS_TESTBED_FILE = os.environ.get('PYATS_TESTBED_FILE') # For PyATS tools
    # Add other global config settings here

class DevelopmentConfig(Config):
    DEBUG = True
    # Add development-specific settings

class ProductionConfig(Config):
    DEBUG = False
    # Add production-specific settings

class TestingConfig(Config):
    TESTING = True
    # Add testing-specific settings 