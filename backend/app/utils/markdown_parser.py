"""Markdown parser utility for theory articles.

Parses markdown files with frontmatter metadata and extracts:
- Metadata (title, estimated_minutes, quiz_questions)
- Content sections
- LaTeX formulas (inline and block)
"""

import re
from pathlib import Path
from typing import Any

import yaml


class TheoryMarkdownParser:
    """Parser for theory article markdown files."""

    def __init__(self, content: str):
        """Initialize parser with markdown content.

        Args:
            content: Raw markdown string with YAML frontmatter
        """
        self.content = content
        self.metadata: dict[str, Any] = {}
        self.body: str = ""
        self._parse()

    def _parse(self) -> None:
        """Parse frontmatter and body from markdown content."""
        # Match YAML frontmatter between --- delimiters
        frontmatter_pattern = r"^---\s*\n(.*?)\n---\s*\n(.*)$"
        match = re.match(frontmatter_pattern, self.content, re.DOTALL)

        if match:
            frontmatter_str = match.group(1)
            self.body = match.group(2).strip()
            self.metadata = yaml.safe_load(frontmatter_str) or {}
        else:
            # No frontmatter, treat entire content as body
            self.body = self.content.strip()

    @property
    def title(self) -> str:
        """Get article title from metadata."""
        return self.metadata.get("title", "")

    @property
    def estimated_minutes(self) -> int:
        """Get estimated reading time in minutes."""
        return self.metadata.get("estimated_minutes", 5)

    @property
    def quiz_questions(self) -> list[str]:
        """Get list of quiz question IDs."""
        return self.metadata.get("quiz_questions", [])

    @property
    def subtopic(self) -> str:
        """Get subtopic identifier."""
        return self.metadata.get("subtopic", "")

    def get_content_html(self) -> str:
        """Get markdown body (frontend will render with react-markdown + KaTeX).

        Returns:
            Markdown content as string (not converted to HTML)
        """
        return self.body

    @classmethod
    def from_file(cls, filepath: Path) -> "TheoryMarkdownParser":
        """Load and parse markdown file.

        Args:
            filepath: Path to markdown file

        Returns:
            TheoryMarkdownParser instance
        """
        content = filepath.read_text(encoding="utf-8")
        return cls(content)


def load_theory_article(subtopic: str, theory_dir: Path) -> dict[str, Any]:
    """Load theory article by subtopic.

    Args:
        subtopic: Subtopic identifier (e.g., 'linear_equations')
        theory_dir: Path to theory articles directory

    Returns:
        Dictionary with article data: {subtopic, title, content_md, estimated_minutes, quiz_questions}

    Raises:
        FileNotFoundError: If article file doesn't exist
    """
    filepath = theory_dir / f"{subtopic}.md"
    if not filepath.exists():
        raise FileNotFoundError(f"Theory article not found: {subtopic}")

    parser = TheoryMarkdownParser.from_file(filepath)

    return {
        "subtopic": subtopic,
        "title": parser.title,
        "content_md": parser.body,
        "estimated_minutes": parser.estimated_minutes,
        "quiz_questions": parser.quiz_questions,
    }


def list_all_theory_articles(theory_dir: Path) -> list[dict[str, Any]]:
    """List all available theory articles with metadata.

    Args:
        theory_dir: Path to theory articles directory

    Returns:
        List of article metadata dicts: [{subtopic, title, estimated_minutes}, ...]
    """
    articles = []

    for filepath in sorted(theory_dir.glob("*.md")):
        subtopic = filepath.stem
        parser = TheoryMarkdownParser.from_file(filepath)

        articles.append(
            {
                "subtopic": subtopic,
                "title": parser.title,
                "estimated_minutes": parser.estimated_minutes,
            }
        )

    return articles
