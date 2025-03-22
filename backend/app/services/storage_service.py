import os
import tempfile
from typing import Optional, BinaryIO
from azure.storage.blob import BlobServiceClient, BlobClient, ContainerClient

class AzureBlobStorageService:
    def __init__(self):
        connection_string = os.getenv("AZURE_STORAGE_CONNECTION_STRING")
        if not connection_string:
            raise ValueError("Azure Storage Connection String not configured")
            
        self.blob_service_client = BlobServiceClient.from_connection_string(connection_string)
        self.container_name = os.getenv("AZURE_STORAGE_CONTAINER_NAME", "conversations")
        
        # Ensure container exists
        self._ensure_container_exists()
        
    def _ensure_container_exists(self):
        try:
            self.blob_service_client.get_container_client(self.container_name).get_container_properties()
        except Exception:
            self.blob_service_client.create_container(self.container_name)
    
    def upload_audio(self, conversation_id: str, audio_file: BinaryIO) -> str:
        """Upload audio file to Azure Blob Storage"""
        blob_name = f"{conversation_id}/recording.webm"
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name, 
            blob=blob_name
        )
        
        blob_client.upload_blob(audio_file, overwrite=True)
        
        return blob_client.url
    
    def download_audio(self, conversation_id: str) -> Optional[str]:
        """Download audio file from Azure Blob Storage and save to a temp file"""
        blob_name = f"{conversation_id}/recording.webm"
        blob_client = self.blob_service_client.get_blob_client(
            container=self.container_name, 
            blob=blob_name
        )
        
        try:
            # Create a temporary file
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=".webm")
            temp_file.close()
            
            # Download the blob to the temporary file
            with open(temp_file.name, "wb") as file:
                download_stream = blob_client.download_blob()
                file.write(download_stream.readall())
                
            return temp_file.name
        except Exception as e:
            print(f"Error downloading blob: {e}")
            return None
