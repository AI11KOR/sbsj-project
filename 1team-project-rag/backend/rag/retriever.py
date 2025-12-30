"""
검색기 모듈

임베딩 모델과 벡터 스토어를 사용하여 관련 문서를 검색합니다.
"""

from typing import List, Dict, Any, Optional
from .embeddings import BGEEmbeddings
from .vector_store import ChromaVectorStore
from .document_loader import Document


class Retriever:
    """문서 검색기 클래스"""

    def __init__(
        self,
        embeddings: BGEEmbeddings = None,
        vector_store: ChromaVectorStore = None,
        top_k: int = 3,
        score_threshold: float = 0.5
    ):
        """
        검색기 초기화

        Args:
            embeddings: 임베딩 모델 인스턴스
            vector_store: 벡터 스토어 인스턴스
            top_k: 반환할 문서 개수
            score_threshold: 최소 유사도 점수 (0~1, 낮을수록 유사)
        """
        # 임베딩 모델 초기화
        if embeddings is None:
            print("🔧 기본 임베딩 모델(BGE-M3-KO) 초기화 중...")
            self.embeddings = BGEEmbeddings()
        else:
            self.embeddings = embeddings

        # 벡터 스토어 초기화
        if vector_store is None:
            print("🔧 기본 벡터 스토어(ChromaDB) 초기화 중...")
            self.vector_store = ChromaVectorStore()
        else:
            self.vector_store = vector_store

        self.top_k = top_k
        self.score_threshold = score_threshold

    def search(
        self,
        query: str,
        top_k: Optional[int] = None,
        filter_metadata: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """
        쿼리에 대한 관련 문서 검색

        Args:
            query: 검색 쿼리
            top_k: 반환할 문서 개수 (None이면 기본값 사용)
            filter_metadata: 메타데이터 필터

        Returns:
            검색 결과 리스트 [
                {
                    "content": "문서 내용",
                    "metadata": {...},
                    "score": 0.95,
                    "id": "doc_1"
                },
                ...
            ]
        """
        if not query or not query.strip():
            raise ValueError("검색 쿼리가 비어있습니다.")

        # top_k 설정
        k = top_k if top_k is not None else self.top_k

        # 쿼리 임베딩
        print(f"[SEARCH] 검색 쿼리: {query}")
        query_embedding = self.embeddings.embed_query(query)

        # 벡터 검색
        try:
            results = self.vector_store.search(
                query_embedding=query_embedding,
                top_k=k,
                filter_metadata=filter_metadata
            )
        except Exception as e:
            # ChromaDB 인덱스 손상/버전 불일치 등으로 query 단계에서 터질 수 있습니다.
            # 이 경우 RAG를 포기하고(빈 sources) MCP/LLM 답변 흐름은 유지하도록 빈 결과를 반환합니다.
            print(f"[WARN] RAG 검색을 건너뜁니다 (벡터 스토어 오류): {e}")
            print("       -> 해결: data/chroma_db 삭제 후 index_documents.py 재실행(재인덱싱)")
            return []

        # 결과 포맷팅 및 필터링
        formatted_results = []
        for i, (doc, metadata, distance, doc_id) in enumerate(zip(
            results["documents"],
            results["metadatas"],
            results["distances"],
            results["ids"]
        )):
            # 유사도 점수 계산 (distance를 similarity로 변환)
            # ChromaDB의 cosine distance: 0(완전 유사) ~ 2(완전 다름)
            # 이를 similarity score로 변환: 1 - (distance/2)
            similarity_score = 1 - (distance / 2)

            # 임계값 필터링
            if distance <= self.score_threshold or self.score_threshold <= 0:
                formatted_results.append({
                    "content": doc,
                    "metadata": metadata,
                    "score": round(similarity_score, 4),
                    "distance": round(distance, 4),
                    "id": doc_id,
                    "rank": i + 1
                })

        print(f"[OK] {len(formatted_results)}개 문서 검색 완료")
        return formatted_results

    def get_relevant_documents(self, query: str) -> List[Document]:
        """
        LangChain 호환 인터페이스

        Args:
            query: 검색 쿼리

        Returns:
            Document 객체 리스트
        """
        results = self.search(query)
        documents = []

        for result in results:
            doc = Document(
                page_content=result["content"],
                metadata=result["metadata"]
            )
            documents.append(doc)

        return documents

    def format_documents_for_prompt(
        self,
        results: List[Dict[str, Any]],
        include_metadata: bool = True
    ) -> str:
        """
        검색 결과를 프롬프트용 텍스트로 포맷팅

        Args:
            results: 검색 결과 리스트
            include_metadata: 메타데이터 포함 여부

        Returns:
            포맷팅된 텍스트
        """
        if not results:
            return "관련 문서를 찾을 수 없습니다."

        formatted_text = []
        for i, result in enumerate(results):
            text = f"[문서 {i+1}] (유사도: {result['score']:.2f})\n"

            if include_metadata and result.get("metadata"):
                source = result["metadata"].get("source", "unknown")
                text += f"출처: {source}\n"

            text += f"{result['content']}"
            formatted_text.append(text)

        return "\n\n---\n\n".join(formatted_text)


# 사용 예시
if __name__ == "__main__":
    # 검색기 초기화
    retriever = Retriever(top_k=3)

    # 검색 테스트
    query = "강남에서 카페를 창업하려고 합니다"
    results = retriever.search(query)

    print(f"\n=== 검색 결과 ===")
    for result in results:
        print(f"\n[{result['rank']}] 유사도: {result['score']:.3f}")
        print(f"내용: {result['content'][:100]}...")
        print(f"출처: {result['metadata'].get('source', 'unknown')}")

    # 프롬프트용 포맷팅
    print(f"\n=== 프롬프트용 포맷 ===")
    formatted = retriever.format_documents_for_prompt(results)
    print(formatted)

