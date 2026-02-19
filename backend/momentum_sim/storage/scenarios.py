"""
backend/momentum_sim/storage/scenarios.py
Scenario persistence and retrieval using SQLite
"""

import sqlite3
import json
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional


class ScenarioStore:
    """
    Persist simulation scenarios to SQLite for later retrieval and comparison.
    """
    
    DB_PATH = Path(__file__).parent.parent.parent / "scenarios.db"
    
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path or str(self.DB_PATH)
        self._init_db()
    
    def _init_db(self):
        """Create schema if it doesn't exist."""
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                CREATE TABLE IF NOT EXISTS scenarios (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    description TEXT,
                    formation_a TEXT NOT NULL,
                    formation_b TEXT NOT NULL,
                    tactic_a TEXT NOT NULL,
                    tactic_b TEXT NOT NULL,
                    iterations INTEGER,
                    crowd_noise REAL,
                    created_at TEXT,
                    updated_at TEXT,
                    tags TEXT,
                    results_json TEXT,
                    metadata_json TEXT
                )
            """)
            
            conn.execute("""
                CREATE TABLE IF NOT EXISTS scenario_comparisons (
                    id TEXT PRIMARY KEY,
                    name TEXT NOT NULL,
                    created_at TEXT,
                    scenario_ids TEXT,
                    notes TEXT
                )
            """)
            
            conn.commit()
    
    def save_scenario(
        self,
        name: str,
        results: Dict,
        config: Dict,
        description: str = "",
        tags: List[str] = None
    ) -> str:
        """
        Save a simulation scenario.
        
        Args:
            name: Human-readable scenario name
            results: Full simulation result dict
            config: Configuration dict (formation, tactic, etc.)
            description: Optional description
            tags: Optional list of tags for organization
        
        Returns:
            scenario_id: Unique ID for the saved scenario
        """
        scenario_id = str(uuid.uuid4())[:8]
        now = datetime.now().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO scenarios (
                    id, name, description, formation_a, formation_b,
                    tactic_a, tactic_b, iterations, crowd_noise,
                    created_at, updated_at, tags, results_json, metadata_json
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                scenario_id,
                name,
                description,
                config.get("formation", "4-3-3"),
                config.get("formation_b", "4-4-2"),
                config.get("tactic", "balanced"),
                config.get("tactic_b", "balanced"),
                config.get("iterations", 500),
                config.get("crowd_noise", 80.0),
                now,
                now,
                json.dumps(tags or []),
                json.dumps(results),
                json.dumps(config)
            ))
            conn.commit()
        
        return scenario_id
    
    def get_scenario(self, scenario_id: str) -> Optional[Dict]:
        """
        Retrieve a saved scenario by ID.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM scenarios WHERE id = ?",
                (scenario_id,)
            )
            row = cursor.fetchone()
        
        if not row:
            return None
        
        return {
            "id": row["id"],
            "name": row["name"],
            "description": row["description"],
            "formation_a": row["formation_a"],
            "formation_b": row["formation_b"],
            "tactic_a": row["tactic_a"],
            "tactic_b": row["tactic_b"],
            "iterations": row["iterations"],
            "crowd_noise": row["crowd_noise"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
            "tags": json.loads(row["tags"] or "[]"),
            "results": json.loads(row["results_json"] or "{}"),
            "config": json.loads(row["metadata_json"] or "{}"),
        }
    
    def list_scenarios(self, limit: int = 50, offset: int = 0, tags: List[str] = None) -> List[Dict]:
        """
        List saved scenarios with optional filtering by tags.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            
            if tags and len(tags) > 0:
                # Filter by any matching tag
                placeholders = ",".join("?" * len(tags))
                query = f"""
                    SELECT id, name, description, formation_a, formation_b,
                           tactic_a, tactic_b, created_at, tags
                    FROM scenarios
                    WHERE tags LIKE ? OR {' OR '.join(['tags LIKE ?' for _ in tags])}
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """
                params = [f"%{tag}%" for tag in tags] + [limit, offset]
                cursor = conn.execute(query, params)
            else:
                cursor = conn.execute("""
                    SELECT id, name, description, formation_a, formation_b,
                           tactic_a, tactic_b, created_at, tags
                    FROM scenarios
                    ORDER BY created_at DESC
                    LIMIT ? OFFSET ?
                """, (limit, offset))
            
            rows = cursor.fetchall()
        
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "description": row["description"],
                "formation_a": row["formation_a"],
                "formation_b": row["formation_b"],
                "tactic_a": row["tactic_a"],
                "tactic_b": row["tactic_b"],
                "created_at": row["created_at"],
                "tags": json.loads(row["tags"] or "[]"),
            }
            for row in rows
        ]
    
    def delete_scenario(self, scenario_id: str) -> bool:
        """
        Delete a scenario by ID.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute("DELETE FROM scenarios WHERE id = ?", (scenario_id,))
            conn.commit()
            return cursor.rowcount > 0
    
    def update_scenario_metadata(
        self,
        scenario_id: str,
        name: str = None,
        description: str = None,
        tags: List[str] = None
    ) -> bool:
        """
        Update scenario metadata without re-running simulation.
        """
        updates = []
        params = []
        
        if name is not None:
            updates.append("name = ?")
            params.append(name)
        if description is not None:
            updates.append("description = ?")
            params.append(description)
        if tags is not None:
            updates.append("tags = ?")
            params.append(json.dumps(tags))
        
        if not updates:
            return False
        
        updates.append("updated_at = ?")
        params.append(datetime.now().isoformat())
        params.append(scenario_id)
        
        query = f"UPDATE scenarios SET {', '.join(updates)} WHERE id = ?"
        
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(query, params)
            conn.commit()
            return cursor.rowcount > 0
    
    def create_comparison(
        self,
        name: str,
        scenario_ids: List[str],
        notes: str = ""
    ) -> str:
        """
        Create a comparison group of multiple scenarios.
        """
        comparison_id = str(uuid.uuid4())[:8]
        now = datetime.now().isoformat()
        
        with sqlite3.connect(self.db_path) as conn:
            conn.execute("""
                INSERT INTO scenario_comparisons (id, name, created_at, scenario_ids, notes)
                VALUES (?, ?, ?, ?, ?)
            """, (
                comparison_id,
                name,
                now,
                json.dumps(scenario_ids),
                notes
            ))
            conn.commit()
        
        return comparison_id
    
    def get_comparison(self, comparison_id: str) -> Optional[Dict]:
        """
        Retrieve a comparison group.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute(
                "SELECT * FROM scenario_comparisons WHERE id = ?",
                (comparison_id,)
            )
            row = cursor.fetchone()
        
        if not row:
            return None
        
        scenario_ids = json.loads(row["scenario_ids"] or "[]")
        scenarios = [self.get_scenario(sid) for sid in scenario_ids]
        
        return {
            "id": row["id"],
            "name": row["name"],
            "created_at": row["created_at"],
            "notes": row["notes"],
            "scenario_ids": scenario_ids,
            "scenarios": [s for s in scenarios if s is not None],
        }
    
    def list_comparisons(self, limit: int = 20, offset: int = 0) -> List[Dict]:
        """
        List all comparison groups.
        """
        with sqlite3.connect(self.db_path) as conn:
            conn.row_factory = sqlite3.Row
            cursor = conn.execute("""
                SELECT id, name, created_at, scenario_ids
                FROM scenario_comparisons
                ORDER BY created_at DESC
                LIMIT ? OFFSET ?
            """, (limit, offset))
            rows = cursor.fetchall()
        
        return [
            {
                "id": row["id"],
                "name": row["name"],
                "created_at": row["created_at"],
                "scenario_count": len(json.loads(row["scenario_ids"] or "[]")),
            }
            for row in rows
        ]
    
    def delete_comparison(self, comparison_id: str) -> bool:
        """
        Delete a comparison group.
        """
        with sqlite3.connect(self.db_path) as conn:
            cursor = conn.execute(
                "DELETE FROM scenario_comparisons WHERE id = ?",
                (comparison_id,)
            )
            conn.commit()
            return cursor.rowcount > 0
