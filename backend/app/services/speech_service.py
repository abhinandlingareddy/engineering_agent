import os
import logging
import tempfile
from typing import Optional, List
import azure.cognitiveservices.speech as speechsdk
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class SpeechToTextProvider(ABC):
    @abstractmethod
    def transcribe_audio_file(self, file_path: str) -> str:
        pass

class AzureSpeechToTextProvider(SpeechToTextProvider):
    def __init__(self):
        subscription_key = os.getenv("AZURE_SPEECH_KEY")
        region = os.getenv("AZURE_SPEECH_REGION")
        
        if not subscription_key or not region:
            raise ValueError("Azure Speech Services credentials not configured")
        
        self.speech_config = speechsdk.SpeechConfig(subscription=subscription_key, region=region)
        self.speech_config.speech_recognition_language = "en-US"
        
    def transcribe_audio_file(self, file_path: str) -> str:
        audio_config = speechsdk.audio.AudioConfig(filename=file_path)
        speech_recognizer = speechsdk.SpeechRecognizer(speech_config=self.speech_config, audio_config=audio_config)
        
        logger.info(f"Starting transcription for file: {file_path}")
        
        result = speech_recognizer.recognize_once_async().get()
        
        if result.reason == speechsdk.ResultReason.RecognizedSpeech:
            return result.text
        elif result.reason == speechsdk.ResultReason.NoMatch:
            logger.warning(f"No speech could be recognized: {result.no_match_details}")
            return ""
        elif result.reason == speechsdk.ResultReason.Canceled:
            cancellation_details = result.cancellation_details
            logger.error(f"Speech recognition canceled: {cancellation_details.reason}")
            if cancellation_details.reason == speechsdk.CancellationReason.Error:
                logger.error(f"Error details: {cancellation_details.error_details}")
            return ""
        
        return ""

class SpeechToTextFactory:
    @staticmethod
    def create_provider(provider_name: str = "azure") -> SpeechToTextProvider:
        if provider_name.lower() == "azure":
            return AzureSpeechToTextProvider()
        else:
            raise ValueError(f"Unsupported speech to text provider: {provider_name}")
