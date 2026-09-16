"""
SIMORGH Platform Integration Adapter

This module provides a clean interface to external Platform services.
It allows Shora to consume Platform capabilities without duplicating them.

For local development, mock implementations are used.
For production, configure PLATFORM_BASE_URL and credentials via environment.
"""
from typing import Optional, Dict, Any, List
from abc import ABC, abstractmethod
import os
import json
from datetime import datetime


class PlatformAI(ABC):
    """Interface for AI Gateway operations."""
    
    @abstractmethod
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        response_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Send a chat completion request."""
        pass


class PlatformKnowledge(ABC):
    """Interface for Knowledge retrieval operations."""
    
    @abstractmethod
    async def search(
        self,
        query: str,
        tenant_id: int,
        domains: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        """Search knowledge base."""
        pass


class PlatformUsage(ABC):
    """Interface for Usage/Credits tracking."""
    
    @abstractmethod
    async def reserve(
        self,
        tenant_id: int,
        run_id: int,
        tokens: int,
    ) -> bool:
        """Reserve token allocation for a run."""
        pass
    
    @abstractmethod
    async def record(
        self,
        tenant_id: int,
        run_id: int,
        tokens_used: int,
        cost_cents: int,
        model: str,
    ) -> None:
        """Record actual usage."""
        pass


class PlatformAudit(ABC):
    """Interface for Audit logging."""
    
    @abstractmethod
    async def log(
        self,
        tenant_id: int,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str],
        resource_id: Optional[int],
        details: Optional[Dict[str, Any]],
    ) -> None:
        """Log an audit event."""
        pass


# ═══ Mock Implementations for Local Development ═══

class MockAI(PlatformAI):
    """Mock AI implementation for testing/local dev."""
    
    def __init__(self):
        self.call_count = 0
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        response_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        self.call_count += 1
        
        # Generate mock response based on context
        last_message = messages[-1]["content"] if messages else ""
        
        # Default structured response format
        if response_format == "json":
            return {
                "content": json.dumps({
                    "summary": f"Analysis of: {last_message[:50]}...",
                    "claims": [],
                    "assumptions": [],
                    "risks": [],
                    "opportunities": [],
                    "recommendations": [],
                    "confidence": 0.75
                }),
                "tokens_used": 150,
                "model": model or "mock-model",
            }
        
        return {
            "content": f"Mock response to: {last_message[:100]}",
            "tokens_used": 100,
            "model": model or "mock-model",
        }


class MockKnowledge(PlatformKnowledge):
    """Mock Knowledge implementation."""
    
    async def search(
        self,
        query: str,
        tenant_id: int,
        domains: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        # Return empty list - no knowledge available in mock mode
        return []


class MockUsage(PlatformUsage):
    """Mock Usage tracking."""
    
    async def reserve(
        self,
        tenant_id: int,
        run_id: int,
        tokens: int,
    ) -> bool:
        return True
    
    async def record(
        self,
        tenant_id: int,
        run_id: int,
        tokens_used: int,
        cost_cents: int,
        model: str,
    ) -> None:
        pass  # No-op in mock mode


class MockAudit(PlatformAudit):
    """Mock Audit logging."""
    
    async def log(
        self,
        tenant_id: int,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str],
        resource_id: Optional[int],
        details: Optional[Dict[str, Any]],
    ) -> None:
        pass  # No-op in mock mode


# ═══ HTTP Implementation for Production ═══

class HTTPAI(PlatformAI):
    """HTTP-based AI Gateway client."""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
    
    async def chat(
        self,
        messages: List[Dict[str, str]],
        model: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: Optional[int] = None,
        response_format: Optional[str] = None,
    ) -> Dict[str, Any]:
        import aiohttp
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
        }
        
        payload = {
            "messages": messages,
            "model": model,
            "temperature": temperature,
            "max_tokens": max_tokens,
        }
        
        if response_format:
            payload["response_format"] = {"type": response_format}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/v1/chat/completions",
                headers=headers,
                json=payload,
            ) as resp:
                resp.raise_for_status()
                return await resp.json()


class HTTPKnowledge(PlatformKnowledge):
    """HTTP-based Knowledge client."""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
    
    async def search(
        self,
        query: str,
        tenant_id: int,
        domains: Optional[List[str]] = None,
        limit: int = 10,
    ) -> List[Dict[str, Any]]:
        import aiohttp
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        params = {"q": query, "tenant_id": tenant_id, "limit": limit}
        if domains:
            params["domains"] = ",".join(domains)
        
        async with aiohttp.ClientSession() as session:
            async with session.get(
                f"{self.base_url}/api/knowledge/search",
                headers=headers,
                params=params,
            ) as resp:
                resp.raise_for_status()
                data = await resp.json()
                return data.get("results", [])


class HTTPUsage(PlatformUsage):
    """HTTP-based Usage client."""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
    
    async def reserve(
        self,
        tenant_id: int,
        run_id: int,
        tokens: int,
    ) -> bool:
        import aiohttp
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {"tenant_id": tenant_id, "run_id": run_id, "tokens": tokens}
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/usage/reserve",
                headers=headers,
                json=payload,
            ) as resp:
                resp.raise_for_status()
                data = await resp.json()
                return data.get("success", False)
    
    async def record(
        self,
        tenant_id: int,
        run_id: int,
        tokens_used: int,
        cost_cents: int,
        model: str,
    ) -> None:
        import aiohttp
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "tenant_id": tenant_id,
            "run_id": run_id,
            "tokens_used": tokens_used,
            "cost_cents": cost_cents,
            "model": model,
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/usage/record",
                headers=headers,
                json=payload,
            ):
                pass  # Fire and forget


class HTTPAudit(PlatformAudit):
    """HTTP-based Audit client."""
    
    def __init__(self, base_url: str, api_key: str):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
    
    async def log(
        self,
        tenant_id: int,
        user_id: Optional[int],
        action: str,
        resource_type: Optional[str],
        resource_id: Optional[int],
        details: Optional[Dict[str, Any]],
    ) -> None:
        import aiohttp
        
        headers = {"Authorization": f"Bearer {self.api_key}"}
        payload = {
            "tenant_id": tenant_id,
            "user_id": user_id,
            "action": action,
            "resource_type": resource_type,
            "resource_id": resource_id,
            "details": details or {},
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/api/audit/log",
                headers=headers,
                json=payload,
            ):
                pass  # Fire and forget


# ═══ Platform Client Factory ═══

class PlatformClient:
    """
    Main entry point for Platform services.
    
    Usage:
        platform = PlatformClient()
        result = await platform.ai.chat(...)
        results = await platform.knowledge.search(...)
    """
    
    def __init__(self, use_mock: bool = True):
        """
        Initialize platform client.
        
        Args:
            use_mock: If True, use mock implementations for local dev.
                     If False, use HTTP clients with configured endpoints.
        """
        if use_mock:
            self.ai = MockAI()
            self.knowledge = MockKnowledge()
            self.usage = MockUsage()
            self.audit = MockAudit()
        else:
            base_url = os.getenv("PLATFORM_BASE_URL", "http://localhost:8001")
            api_key = os.getenv("PLATFORM_API_KEY", "")
            
            self.ai = HTTPAI(base_url, api_key)
            self.knowledge = HTTPKnowledge(base_url, api_key)
            self.usage = HTTPUsage(base_url, api_key)
            self.audit = HTTPAudit(base_url, api_key)


# ═══ Global Instance ═══

# Determine mode from environment
USE_MOCK_PLATFORM = os.getenv("USE_MOCK_PLATFORM", "true").lower() == "true"
platform = PlatformClient(use_mock=USE_MOCK_PLATFORM)
