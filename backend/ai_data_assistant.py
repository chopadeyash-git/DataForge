import pandas as pd
import numpy as np
import json
import os
import re
from datetime import datetime
from typing import Dict, Any, List, Optional, Tuple
import logging
import google.generativeai as genai

class AIDataAssistant:
    def __init__(self, gemini_api_key=None):
        self.current_dataset = None
        self.dataset_info = {}
        self.operation_history = []
        self.supported_formats = ['.csv', '.xlsx', '.xls', '.json', '.parquet']
        
        # Initialize Gemini AI
        self.gemini_model = None
        if gemini_api_key:
            try:
                genai.configure(api_key=gemini_api_key)
                self.gemini_model = genai.GenerativeModel('gemini-pro')
                print("✅ AI initialized for smart command understanding")
            except Exception as e:
                print(f"⚠️ AI initialization failed: {e}")
                self.gemini_model = None
        
    def load_dataset(self, file_path: str) -> Dict[str, Any]:
        """Load dataset from file and provide initial analysis"""
        try:
            file_ext = os.path.splitext(file_path)[1].lower()
            
            if file_ext == '.csv':
                # Try multiple encodings and methods for CSV files
                encodings = ['utf-8', 'latin-1', 'iso-8859-1', 'cp1252']
                for encoding in encodings:
                    try:
                        self.current_dataset = pd.read_csv(file_path, encoding=encoding)
                        break
                    except UnicodeDecodeError:
                        continue
                    except Exception as e:
                        if encoding == encodings[-1]:  # Last encoding attempt
                            # Try with error handling
                            try:
                                self.current_dataset = pd.read_csv(file_path, encoding='utf-8', errors='ignore')
                            except:
                                try:
                                    self.current_dataset = pd.read_csv(file_path, encoding='latin-1', errors='ignore')
                                except:
                                    raise e
                        else:
                            continue
                            
            elif file_ext in ['.xlsx', '.xls']:
                try:
                    self.current_dataset = pd.read_excel(file_path)
                except Exception as e:
                    # Try with openpyxl engine for xlsx files
                    if file_ext == '.xlsx':
                        try:
                            self.current_dataset = pd.read_excel(file_path, engine='openpyxl')
                        except:
                            raise e
                    else:
                        raise e
                        
            elif file_ext == '.json':
                try:
                    self.current_dataset = pd.read_json(file_path)
                except Exception as e:
                    # Try reading as lines-delimited JSON
                    try:
                        self.current_dataset = pd.read_json(file_path, lines=True)
                    except:
                        raise e
                        
            elif file_ext == '.parquet':
                try:
                    self.current_dataset = pd.read_parquet(file_path)
                except Exception as e:
                    return {"error": f"Failed to read Parquet file. Make sure you have pyarrow or fastparquet installed: {str(e)}"}
                    
            else:
                return {"error": f"Unsupported file format: {file_ext}. Supported formats: CSV, Excel (.xlsx, .xls), JSON, Parquet"}
            
            # Validate that we successfully loaded data
            if self.current_dataset is None or len(self.current_dataset) == 0:
                return {"error": "The file appears to be empty or could not be read properly"}
            
            if len(self.current_dataset.columns) == 0:
                return {"error": "No columns found in the dataset"}
            
            # Generate dataset summary
            summary = self._analyze_dataset()
            self.dataset_info = summary
            
            return {
                "success": True,
                "message": "Dataset loaded successfully!",
                "summary": summary,
                "preview": self.current_dataset.head().to_dict('records')
            }
            
        except Exception as e:
            return {"error": f"Failed to load dataset: {str(e)}"}
    
    def _analyze_dataset(self) -> Dict[str, Any]:
        """Analyze the current dataset and provide comprehensive summary"""
        if self.current_dataset is None:
            return {}
        
        df = self.current_dataset
        
        # Basic info
        basic_info = {
            "rows": len(df),
            "columns": len(df.columns),
            "size_mb": round(df.memory_usage(deep=True).sum() / 1024 / 1024, 2)
        }
        
        # Column analysis
        columns_info = []
        for col in df.columns:
            col_info = {
                "name": col,
                "type": str(df[col].dtype),
                "non_null": int(df[col].count()),
                "null_count": int(df[col].isnull().sum()),
                "null_percentage": round((df[col].isnull().sum() / len(df)) * 100, 2),
                "unique_values": int(df[col].nunique())
            }
            
            # Add statistics for numeric columns
            if df[col].dtype in ['int64', 'float64', 'int32', 'float32']:
                col_info.update({
                    "mean": round(df[col].mean(), 2) if not df[col].isnull().all() else None,
                    "median": round(df[col].median(), 2) if not df[col].isnull().all() else None,
                    "std": round(df[col].std(), 2) if not df[col].isnull().all() else None,
                    "min": df[col].min() if not df[col].isnull().all() else None,
                    "max": df[col].max() if not df[col].isnull().all() else None
                })
            
            columns_info.append(col_info)
        
        # Data quality issues
        quality_issues = []
        
        # Check for duplicates
        duplicate_count = df.duplicated().sum()
        if duplicate_count > 0:
            quality_issues.append(f"{duplicate_count} duplicate rows found")
        
        # Check for missing values
        missing_cols = df.columns[df.isnull().any()].tolist()
        if missing_cols:
            quality_issues.append(f"Missing values in columns: {', '.join(missing_cols)}")
        
        return {
            "basic_info": basic_info,
            "columns": columns_info,
            "quality_issues": quality_issues,
            "sample_data": df.head(3).to_dict('records')
        }
    
    def _parse_command_with_gemini(self, user_message: str) -> Dict[str, Any]:
        """Use Gemini AI to intelligently parse user commands"""
        if not self.gemini_model:
            return {"parsed": False, "original_message": user_message}
        
        try:
            # Get column names for context
            columns_info = ""
            if self.current_dataset is not None:
                columns_info = f"Available columns: {', '.join(self.current_dataset.columns.tolist())}"
            
            prompt = f"""
You are a data analysis assistant. Parse the following user command and extract the intent and parameters.

{columns_info}

User command: "{user_message}"

IMPORTANT: Match column names exactly as they appear in the available columns list above. Use fuzzy matching if needed.

Analyze this command and respond with a JSON object containing:
{{
    "intent": "one of: describe_dataset, calculate_mean, calculate_median, calculate_std, drop_column, drop_rows, filter_data, replace_values, rename_column, correlation, unique_values, missing_values, duplicates, export_dataset, show_columns",
    "column_name": "exact column name from available columns (null if not applicable)",
    "operation": "specific operation requested",
    "parameters": {{
        "value": "numeric value if mentioned",
        "condition": "filter condition if applicable (>, <, >=, <=, ==)",
        "method": "method like mean, median, etc.",
        "replacement_value": "value to replace with"
    }},
    "confidence": "high/medium/low",
    "explanation": "brief explanation of what the user wants to do",
    "suggested_column": "closest matching column name if exact match not found"
}}

Examples:
- "calculate mean of salary" → intent: "calculate_mean", column_name: "salary"
- "drop the age column" → intent: "drop_column", column_name: "age"
- "filter rows where price > 100" → intent: "filter_data", column_name: "price", parameters: {{"value": 100, "condition": ">"}}
- "what is this dataset about" → intent: "describe_dataset"
- "show me all columns" → intent: "show_columns"
- "replace missing values in income with 0" → intent: "replace_values", column_name: "income", parameters: {{"method": "value", "replacement_value": 0}}

Respond only with valid JSON.
"""
            
            response = self.gemini_model.generate_content(prompt)
            
            # Parse Gemini response
            try:
                parsed_response = json.loads(response.text)
                parsed_response["parsed"] = True
                parsed_response["original_message"] = user_message
                return parsed_response
            except json.JSONDecodeError:
                # If JSON parsing fails, extract intent manually
                response_text = response.text.lower()
                return {
                    "parsed": True,
                    "intent": "general_query",
                    "explanation": response.text,
                    "original_message": user_message,
                    "confidence": "medium"
                }
                
        except Exception as e:
            print(f"Gemini parsing error: {e}")
            return {"parsed": False, "original_message": user_message}
    
    def process_chat_command(self, user_message: str) -> Dict[str, Any]:
        """Process natural language commands and execute data operations"""
        if self.current_dataset is None:
            return {
                "response": "Please upload a dataset first before I can help you analyze it!",
                "type": "error"
            }
        
        # First, try to parse with Gemini AI
        parsed_command = self._parse_command_with_gemini(user_message)
        
        if parsed_command.get("parsed"):
            # Use Gemini-parsed intent
            intent = parsed_command.get("intent")
            column_name = parsed_command.get("column_name")
            parameters = parsed_command.get("parameters", {})
            explanation = parsed_command.get("explanation", "")
            
            # Log the parsed command
            self._log_operation(f"Gemini parsed: {intent} - {explanation}")
            
            # Execute based on parsed intent
            if intent == "describe_dataset":
                return self._describe_dataset()
            elif intent == "calculate_mean" and column_name:
                return self._calculate_mean_by_column(column_name)
            elif intent == "calculate_median" and column_name:
                return self._calculate_median_by_column(column_name)
            elif intent == "calculate_std" and column_name:
                return self._calculate_std_by_column(column_name)
            elif intent == "drop_column" and column_name:
                return self._drop_column_by_name(column_name)
            elif intent == "filter_data" and column_name:
                value = parameters.get("value")
                condition = parameters.get("condition", ">")
                return self._filter_data_by_condition(column_name, condition, value)
            elif intent == "replace_values":
                method = parameters.get("method", "mean")
                return self._replace_missing_values(column_name, method, None)
            elif intent == "duplicates":
                return self._handle_duplicates("remove duplicates")
            elif intent == "export_dataset":
                return self._export_dataset("export dataset")
            elif intent == "missing_values":
                return self._analyze_missing_values()
            elif intent == "correlation":
                return self._calculate_correlation()
            elif intent == "unique_values" and column_name:
                return self._get_unique_values_for_column(column_name)
            elif intent == "show_columns":
                return self._show_available_columns()
            elif intent == "replace_values" and column_name:
                method = parameters.get("method", "mean")
                replacement_value = parameters.get("replacement_value")
                return self._replace_missing_values(column_name, method, replacement_value)
            else:
                # If parsed but no specific handler, provide helpful response
                return {
                    "response": f"I understand you want to: {explanation}\n\nLet me help you with that. Here are some suggestions:\n• Be more specific about column names\n• Try: 'calculate mean of [column_name]'\n• Or: 'drop column [column_name]'",
                    "type": "help"
                }
        
        # Fallback to original pattern matching
        message = user_message.lower().strip()
        
        # Pattern matching for different commands
        if any(word in message for word in ['what', 'about', 'describe', 'summary', 'info']):
            return self._describe_dataset()
        
        elif any(word in message for word in ['mean', 'average']):
            return self._calculate_mean(message)
        
        elif 'median' in message:
            return self._calculate_median(message)
        
        elif 'std' in message or 'standard deviation' in message:
            return self._calculate_std(message)
        
        elif any(word in message for word in ['drop', 'delete', 'remove']) and 'column' in message:
            return self._drop_column(message)
        
        elif any(word in message for word in ['drop', 'delete', 'remove']) and 'row' in message:
            return self._drop_rows(message)
        
        elif 'filter' in message or 'where' in message:
            return self._filter_data(message)
        
        elif 'replace' in message or 'fill' in message:
            return self._replace_values(message)
        
        elif 'rename' in message and 'column' in message:
            return self._rename_column(message)
        
        elif any(word in message for word in ['correlation', 'corr']):
            return self._calculate_correlation()
        
        elif 'unique' in message and 'values' in message:
            return self._get_unique_values(message)
        
        elif 'missing' in message or 'null' in message:
            return self._analyze_missing_values()
        
        elif 'column' in message and ('show' in message or 'list' in message):
            return self._show_available_columns()
        
        elif 'duplicate' in message:
            return self._handle_duplicates(message)
        
        elif 'export' in message or 'download' in message:
            return self._export_dataset(message)
        
        elif 'history' in message or 'previous' in message:
            return self._show_history_options(message)
        
        else:
            # Enhanced help with Gemini understanding
            help_response = "I didn't understand that command. Here's what I can help you with:\n\n"
            help_response += "📊 **Data Analysis:**\n• 'What is this dataset about?'\n• 'Show me missing values'\n• 'Calculate correlation matrix'\n\n"
            help_response += "📝 **Statistics:**\n• 'Calculate mean' (I'll show you available columns)\n• 'Find median' (I'll show you available columns)\n• 'Show unique values' (I'll show you available columns)\n\n"
            help_response += "🧹 **Data Cleaning:**\n• 'Drop column' (I'll show you available columns)\n• 'Remove duplicate rows'\n• 'Remove duplicates based on column' (I'll show you options)\n• 'Replace missing values with mean'\n\n"
            help_response += "🔍 **Filtering:**\n• 'Filter rows where [column] > [value]'\n• 'Show rows where [column] contains [text]'\n\n"
            help_response += "💾 **Export:**\n• 'Export dataset'\n• 'Download processed data'"
            
            return {
                "response": help_response,
                "type": "help"
            }
    
    def _describe_dataset(self) -> Dict[str, Any]:
        """Provide a natural language description of the dataset"""
        info = self.dataset_info
        basic = info.get('basic_info', {})
        columns = info.get('columns', [])
        issues = info.get('quality_issues', [])
        
        response = f"📊 **Dataset Overview:**\n\n"
        response += f"• **Size:** {basic.get('rows', 0)} rows × {basic.get('columns', 0)} columns\n"
        response += f"• **Memory:** {basic.get('size_mb', 0)} MB\n\n"
        
        response += "**Columns:**\n"
        for col in columns[:5]:  # Show first 5 columns
            response += f"• **{col['name']}** ({col['type']}) - {col['unique_values']} unique values"
            if col['null_count'] > 0:
                response += f", {col['null_percentage']}% missing"
            response += "\n"
        
        if len(columns) > 5:
            response += f"... and {len(columns) - 5} more columns\n"
        
        if issues:
            response += f"\n⚠️ **Data Quality Issues:**\n"
            for issue in issues:
                response += f"• {issue}\n"
        
        return {
            "response": response,
            "type": "analysis",
            "data": info
        }
    
    def _calculate_mean_by_column(self, column_name: str) -> Dict[str, Any]:
        """Calculate mean of specified column (Gemini-parsed)"""
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            if not pd.api.types.is_numeric_dtype(self.current_dataset[column_name]):
                return {"response": f"Column '{column_name}' is not numeric. Cannot calculate mean.", "type": "error"}
            
            mean_value = self.current_dataset[column_name].mean()
            self._log_operation(f"Calculated mean of {column_name}: {mean_value}")
            
            return {
                "response": f"📊 Mean of **{column_name}**: {round(mean_value, 2)}",
                "type": "result",
                "value": mean_value
            }
        except Exception as e:
            return {"response": f"Error calculating mean: {str(e)}", "type": "error"}
    
    def _calculate_mean(self, message: str) -> Dict[str, Any]:
        """Calculate mean of specified column"""
        column_name = self._extract_column_name(message)
        if not column_name:
            # Show available numeric columns for selection
            numeric_columns = self.current_dataset.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_columns:
                return {"response": "No numeric columns found in the dataset.", "type": "error"}
            
            response = "📊 **Calculate Mean - Select a Column:**\n\n"
            response += "Available numeric columns:\n"
            for i, col in enumerate(numeric_columns, 1):
                col_info = self.current_dataset[col].describe()
                response += f"{i}. **{col}** (Range: {col_info['min']:.2f} to {col_info['max']:.2f})\n"
            
            response += "\n💡 **Usage:** Type 'calculate mean of [column_name]'\n"
            response += "**Examples:**\n"
            for col in numeric_columns[:3]:
                response += f"• calculate mean of {col}\n"
            
            return {
                "response": response,
                "type": "help",
                "data": {"available_columns": numeric_columns, "operation": "mean"}
            }
        
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            if not pd.api.types.is_numeric_dtype(self.current_dataset[column_name]):
                return {"response": f"Column '{column_name}' is not numeric. Cannot calculate mean.", "type": "error"}
            
            mean_value = self.current_dataset[column_name].mean()
            count = self.current_dataset[column_name].count()
            self._log_operation(f"Calculated mean of {column_name}: {mean_value}")
            
            return {
                "response": f"📊 **Mean of {column_name}:** {round(mean_value, 2)}\n\n📈 **Additional Stats:**\n• Count: {count} values\n• Min: {self.current_dataset[column_name].min():.2f}\n• Max: {self.current_dataset[column_name].max():.2f}",
                "type": "result",
                "value": mean_value
            }
        except Exception as e:
            return {"response": f"Error calculating mean: {str(e)}", "type": "error"}
    
    def _calculate_median_by_column(self, column_name: str) -> Dict[str, Any]:
        """Calculate median of specified column (Gemini-parsed)"""
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            if not pd.api.types.is_numeric_dtype(self.current_dataset[column_name]):
                return {"response": f"Column '{column_name}' is not numeric. Cannot calculate median.", "type": "error"}
            
            median_value = self.current_dataset[column_name].median()
            self._log_operation(f"Calculated median of {column_name}: {median_value}")
            
            return {
                "response": f"📊 Median of **{column_name}**: {round(median_value, 2)}",
                "type": "result",
                "value": median_value
            }
        except Exception as e:
            return {"response": f"Error calculating median: {str(e)}", "type": "error"}
    
    def _calculate_median(self, message: str) -> Dict[str, Any]:
        """Calculate median of specified column"""
        column_name = self._extract_column_name(message)
        if not column_name:
            # Show available numeric columns for selection
            numeric_columns = self.current_dataset.select_dtypes(include=[np.number]).columns.tolist()
            if not numeric_columns:
                return {"response": "No numeric columns found in the dataset.", "type": "error"}
            
            response = "📊 **Calculate Median - Select a Column:**\n\n"
            response += "Available numeric columns:\n"
            for i, col in enumerate(numeric_columns, 1):
                col_info = self.current_dataset[col].describe()
                response += f"{i}. **{col}** (Range: {col_info['min']:.2f} to {col_info['max']:.2f})\n"
            
            response += "\n💡 **Usage:** Type 'calculate median of [column_name]'\n"
            response += "**Examples:**\n"
            for col in numeric_columns[:3]:
                response += f"• calculate median of {col}\n"
            
            return {
                "response": response,
                "type": "help",
                "data": {"available_columns": numeric_columns, "operation": "median"}
            }
        
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            if not pd.api.types.is_numeric_dtype(self.current_dataset[column_name]):
                return {"response": f"Column '{column_name}' is not numeric. Cannot calculate median.", "type": "error"}
            
            median_value = self.current_dataset[column_name].median()
            count = self.current_dataset[column_name].count()
            self._log_operation(f"Calculated median of {column_name}: {median_value}")
            
            return {
                "response": f"📊 **Median of {column_name}:** {round(median_value, 2)}\n\n📈 **Additional Stats:**\n• Count: {count} values\n• Q1: {self.current_dataset[column_name].quantile(0.25):.2f}\n• Q3: {self.current_dataset[column_name].quantile(0.75):.2f}",
                "type": "result",
                "value": median_value
            }
        except Exception as e:
            return {"response": f"Error calculating median: {str(e)}", "type": "error"}
    
    def _calculate_std_by_column(self, column_name: str) -> Dict[str, Any]:
        """Calculate standard deviation of specified column (Gemini-parsed)"""
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            if not pd.api.types.is_numeric_dtype(self.current_dataset[column_name]):
                return {"response": f"Column '{column_name}' is not numeric. Cannot calculate standard deviation.", "type": "error"}
            
            std_value = self.current_dataset[column_name].std()
            self._log_operation(f"Calculated std of {column_name}: {std_value}")
            
            return {
                "response": f"📊 Standard Deviation of **{column_name}**: {round(std_value, 2)}",
                "type": "result",
                "value": std_value
            }
        except Exception as e:
            return {"response": f"Error calculating standard deviation: {str(e)}", "type": "error"}
    
    def _drop_column_by_name(self, column_name: str) -> Dict[str, Any]:
        """Drop specified column from dataset (Gemini-parsed)"""
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            self.current_dataset = self.current_dataset.drop(columns=[column_name])
            self._log_operation(f"Dropped column: {column_name}")
            self.dataset_info = self._analyze_dataset()
            
            return {
                "response": f"✅ Successfully dropped column **{column_name}**. Dataset now has {len(self.current_dataset.columns)} columns.",
                "type": "success",
                "download_available": True
            }
        except Exception as e:
            return {"response": f"Error dropping column: {str(e)}", "type": "error"}
    
    def _filter_data_by_condition(self, column_name: str, condition: str, value: float) -> Dict[str, Any]:
        """Filter dataset based on condition (Gemini-parsed)"""
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            original_rows = len(self.current_dataset)
            
            if condition == ">":
                filtered_df = self.current_dataset[self.current_dataset[column_name] > value]
            elif condition == "<":
                filtered_df = self.current_dataset[self.current_dataset[column_name] < value]
            elif condition == ">=":
                filtered_df = self.current_dataset[self.current_dataset[column_name] >= value]
            elif condition == "<=":
                filtered_df = self.current_dataset[self.current_dataset[column_name] <= value]
            elif condition == "==":
                filtered_df = self.current_dataset[self.current_dataset[column_name] == value]
            else:
                return {"response": f"Unsupported condition: {condition}", "type": "error"}
            
            self.current_dataset = filtered_df
            self._log_operation(f"Filtered {column_name} {condition} {value}")
            self.dataset_info = self._analyze_dataset()
            
            return {
                "response": f"✅ Filtered data where **{column_name} {condition} {value}**. Dataset reduced from {original_rows} to {len(self.current_dataset)} rows.",
                "type": "success",
                "download_available": True
            }
        except Exception as e:
            return {"response": f"Error filtering data: {str(e)}", "type": "error"}
    
    def _show_available_columns(self) -> Dict[str, Any]:
        """Show all available columns in the dataset"""
        try:
            if self.current_dataset is None:
                return {"response": "No dataset loaded.", "type": "error"}
            
            columns_info = self.dataset_info.get('columns', [])
            
            response = f"📋 **Available Columns ({len(columns_info)} total):**\n\n"
            
            for i, col in enumerate(columns_info, 1):
                col_type = col.get('type', 'unknown')
                unique_count = col.get('unique_values', 0)
                null_count = col.get('null_count', 0)
                
                response += f"{i}. **{col['name']}** ({col_type})\n"
                response += f"   • Unique values: {unique_count}\n"
                if null_count > 0:
                    response += f"   • Missing values: {null_count} ({col.get('null_percentage', 0):.1f}%)\n"
                response += "\n"
            
            response += "💡 **Usage examples:**\n"
            response += f"• Calculate mean of {columns_info[0]['name'] if columns_info else 'column_name'}\n"
            response += f"• Drop column {columns_info[1]['name'] if len(columns_info) > 1 else 'column_name'}\n"
            response += f"• Filter rows where {columns_info[0]['name'] if columns_info else 'column_name'} > value"
            
            return {
                "response": response,
                "type": "analysis",
                "data": columns_info
            }
            
        except Exception as e:
            return {"response": f"Error showing columns: {str(e)}", "type": "error"}
    
    def _replace_missing_values(self, column_name: str, method: str, replacement_value=None) -> Dict[str, Any]:
        """Replace missing values in specified column (Gemini-parsed)"""
        try:
            if column_name and column_name in self.current_dataset.columns:
                if method == 'value' and replacement_value is not None:
                    # Replace with specific value
                    self.current_dataset[column_name].fillna(replacement_value, inplace=True)
                    self._log_operation(f"Replaced missing values in {column_name} with {replacement_value}")
                    self.dataset_info = self._analyze_dataset()
                    
                    return {
                        "response": f"✅ Replaced missing values in **{column_name}** with {replacement_value}",
                        "type": "success",
                        "download_available": True
                    }
                elif method == 'mean':
                    mean_val = self.current_dataset[column_name].mean()
                    self.current_dataset[column_name].fillna(mean_val, inplace=True)
                    self._log_operation(f"Replaced missing values in {column_name} with mean")
                    self.dataset_info = self._analyze_dataset()
                    
                    return {
                        "response": f"✅ Replaced missing values in **{column_name}** with mean ({round(mean_val, 2)})",
                        "type": "success",
                        "download_available": True
                    }
                elif method == 'median':
                    median_val = self.current_dataset[column_name].median()
                    self.current_dataset[column_name].fillna(median_val, inplace=True)
                    self._log_operation(f"Replaced missing values in {column_name} with median")
                    self.dataset_info = self._analyze_dataset()
                    
                    return {
                        "response": f"✅ Replaced missing values in **{column_name}** with median ({round(median_val, 2)})",
                        "type": "success",
                        "download_available": True
                    }
            
            return {"response": "Please specify a valid column name and method (mean/median/value)", "type": "error"}
            
        except Exception as e:
            return {"response": f"Error replacing values: {str(e)}", "type": "error"}
    
    def _analyze_missing_values(self) -> Dict[str, Any]:
        """Analyze missing values in the dataset"""
        try:
            missing_data = self.current_dataset.isnull().sum()
            missing_cols = missing_data[missing_data > 0]
            
            if len(missing_cols) == 0:
                return {
                    "response": "✅ Great! No missing values found in the dataset.",
                    "type": "info"
                }
            
            response = f"🔍 **Missing Values Analysis:**\n\n"
            for col, count in missing_cols.items():
                percentage = (count / len(self.current_dataset)) * 100
                response += f"• **{col}**: {count} missing ({percentage:.1f}%)\n"
            
            response += f"\n📊 **Total missing values**: {missing_data.sum()}"
            
            return {
                "response": response,
                "type": "analysis",
                "data": missing_cols.to_dict()
            }
            
        except Exception as e:
            return {"response": f"Error analyzing missing values: {str(e)}", "type": "error"}
    
    def _get_unique_values_for_column(self, column_name: str) -> Dict[str, Any]:
        """Get unique values for specified column (Gemini-parsed)"""
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            unique_values = self.current_dataset[column_name].unique()
            unique_count = len(unique_values)
            
            response = f"🔢 **Unique values in {column_name}:**\n\n"
            response += f"• **Total unique values**: {unique_count}\n\n"
            
            # Show first 10 unique values
            if unique_count <= 10:
                response += "**All unique values:**\n"
                for val in unique_values:
                    response += f"• {val}\n"
            else:
                response += "**First 10 unique values:**\n"
                for val in unique_values[:10]:
                    response += f"• {val}\n"
                response += f"... and {unique_count - 10} more"
            
            return {
                "response": response,
                "type": "analysis",
                "value": unique_count
            }
            
        except Exception as e:
            return {"response": f"Error getting unique values: {str(e)}", "type": "error"}
    
    def _drop_column(self, message: str) -> Dict[str, Any]:
        """Drop specified column from dataset"""
        column_name = self._extract_column_name(message)
        if not column_name:
            # Show available columns for selection
            all_columns = self.current_dataset.columns.tolist()
            
            response = "🗑️ **Drop Column - Select a Column:**\n\n"
            response += "Available columns:\n"
            for i, col in enumerate(all_columns, 1):
                col_type = str(self.current_dataset[col].dtype)
                null_count = self.current_dataset[col].isnull().sum()
                response += f"{i}. **{col}** ({col_type})"
                if null_count > 0:
                    response += f" - {null_count} missing values"
                response += "\n"
            
            response += "\n💡 **Usage:** Type 'drop column [column_name]'\n"
            response += "**Examples:**\n"
            for col in all_columns[:3]:
                response += f"• drop column {col}\n"
            
            return {
                "response": response,
                "type": "help",
                "data": {"available_columns": all_columns, "operation": "drop_column"}
            }
        
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            self.current_dataset = self.current_dataset.drop(columns=[column_name])
            self._log_operation(f"Dropped column: {column_name}")
            self.dataset_info = self._analyze_dataset()  # Update info
            
            return {
                "response": f"✅ Successfully dropped column **{column_name}**. Dataset now has {len(self.current_dataset.columns)} columns.",
                "type": "success",
                "download_available": True
            }
        except Exception as e:
            return {"response": f"Error dropping column: {str(e)}", "type": "error"}
    
    def _drop_rows(self, message: str) -> Dict[str, Any]:
        """Drop rows based on conditions"""
        try:
            if 'missing' in message or 'null' in message or 'nan' in message:
                column_name = self._extract_column_name(message)
                
                if not column_name:
                    # Show column selection for missing values
                    missing_data = self.current_dataset.isnull().sum()
                    missing_cols = missing_data[missing_data > 0]
                    
                    if len(missing_cols) == 0:
                        return {
                            "response": "✅ No missing values found in the dataset!",
                            "type": "info"
                        }
                    
                    response = "🗑️ **Drop Rows with Missing Values - Select Column:**\n\n"
                    response += "Columns with missing values:\n"
                    for col, count in missing_cols.items():
                        percentage = (count / len(self.current_dataset)) * 100
                        response += f"• **{col}**: {count} missing ({percentage:.1f}%)\n"
                    
                    response += "\n💡 **Usage:**\n"
                    response += "• 'drop rows with missing values' - Drop all rows with any missing values\n"
                    response += "• 'drop rows with missing values in [column]' - Drop rows with missing values in specific column\n"
                    
                    return {
                        "response": response,
                        "type": "help",
                        "data": {"available_columns": missing_cols.index.tolist(), "operation": "drop_missing_rows"}
                    }
                
                initial_rows = len(self.current_dataset)
                
                if column_name and column_name in self.current_dataset.columns:
                    # Drop rows with missing values in specific column
                    self.current_dataset = self.current_dataset.dropna(subset=[column_name])
                    removed_count = initial_rows - len(self.current_dataset)
                    self._log_operation(f"Dropped {removed_count} rows with missing values in {column_name}")
                    response_msg = f"✅ Dropped **{removed_count}** rows with missing values in **{column_name}**. Dataset now has {len(self.current_dataset)} rows."
                else:
                    # Drop all rows with any missing values
                    self.current_dataset = self.current_dataset.dropna()
                    removed_count = initial_rows - len(self.current_dataset)
                    self._log_operation(f"Dropped {removed_count} rows with missing values")
                    response_msg = f"✅ Dropped **{removed_count}** rows with missing values. Dataset now has {len(self.current_dataset)} rows."
                
                self.dataset_info = self._analyze_dataset()
                
                return {
                    "response": response_msg + "\n\n💾 **What's next?**\n• Continue working with the data\n• Or download the updated dataset",
                    "type": "success",
                    "data": {"show_download_options": True}
                }
            else:
                # Show available operations for dropping rows
                response = "🗑️ **Drop Rows - Available Options:**\n\n"
                response += "• **Drop rows with missing values** - Remove rows containing null/NaN values\n"
                response += "• **Drop duplicate rows** - Remove duplicate entries\n"
                response += "\n💡 **Examples:**\n"
                response += "• drop rows with missing values\n"
                response += "• drop rows with missing values in age\n"
                response += "• remove duplicate rows\n"
                
                return {"response": response, "type": "help"}
                
        except Exception as e:
            return {"response": f"Error dropping rows: {str(e)}", "type": "error"}
    
    def _filter_data(self, message: str) -> Dict[str, Any]:
        """Filter dataset based on conditions"""
        # Simple filtering - can be enhanced with more complex parsing
        try:
            # Extract basic filter conditions
            if '>' in message:
                parts = message.split('>')
                if len(parts) == 2:
                    column_name = self._extract_column_name(parts[0])
                    value = self._extract_number(parts[1])
                    if column_name and value is not None:
                        filtered_df = self.current_dataset[self.current_dataset[column_name] > value]
                        self.current_dataset = filtered_df
                        self._log_operation(f"Filtered {column_name} > {value}")
                        self.dataset_info = self._analyze_dataset()
                        
                        return {
                            "response": f"✅ Filtered data where **{column_name} > {value}**. Dataset now has {len(self.current_dataset)} rows.",
                            "type": "success",
                            "download_available": True
                        }
            
            return {"response": "Please specify a clear filter condition like 'filter age > 25'", "type": "error"}
            
        except Exception as e:
            return {"response": f"Error filtering data: {str(e)}", "type": "error"}
    
    def _replace_values(self, message: str) -> Dict[str, Any]:
        """Replace values in dataset"""
        try:
            if 'null' in message or 'nan' in message or 'missing' in message:
                column_name = self._extract_column_name(message)
                if column_name and column_name in self.current_dataset.columns:
                    if 'mean' in message:
                        mean_val = self.current_dataset[column_name].mean()
                        self.current_dataset[column_name].fillna(mean_val, inplace=True)
                        self._log_operation(f"Replaced missing values in {column_name} with mean")
                        self.dataset_info = self._analyze_dataset()
                        
                        return {
                            "response": f"✅ Replaced missing values in **{column_name}** with mean ({round(mean_val, 2)})",
                            "type": "success",
                            "download_available": True
                        }
                    elif 'median' in message:
                        median_val = self.current_dataset[column_name].median()
                        self.current_dataset[column_name].fillna(median_val, inplace=True)
                        self._log_operation(f"Replaced missing values in {column_name} with median")
                        self.dataset_info = self._analyze_dataset()
                        
                        return {
                            "response": f"✅ Replaced missing values in **{column_name}** with median ({round(median_val, 2)})",
                            "type": "success",
                            "download_available": True
                        }
            
            return {"response": "Please specify what to replace, e.g., 'replace missing values in age with mean'", "type": "error"}
            
        except Exception as e:
            return {"response": f"Error replacing values: {str(e)}", "type": "error"}
    
    def _handle_duplicates(self, message: str) -> Dict[str, Any]:
        """Handle duplicate rows"""
        try:
            if 'remove' in message or 'drop' in message:
                # Check if specific columns mentioned
                column_name = self._extract_column_name(message)
                
                if not column_name and ('based on' in message or 'in column' in message or 'by column' in message):
                    # Show column selection for subset-based duplicate removal
                    all_columns = self.current_dataset.columns.tolist()
                    
                    response = "🔄 **Remove Duplicates - Select Columns:**\n\n"
                    response += "Choose columns to check for duplicates:\n"
                    for i, col in enumerate(all_columns, 1):
                        duplicate_count = self.current_dataset.duplicated(subset=[col]).sum()
                        response += f"{i}. **{col}** - {duplicate_count} duplicates based on this column\n"
                    
                    response += "\n💡 **Usage:**\n"
                    response += "• 'remove duplicates' - Remove all duplicate rows\n"
                    response += "• 'remove duplicates based on [column]' - Remove duplicates based on specific column\n"
                    
                    return {
                        "response": response,
                        "type": "help",
                        "data": {"available_columns": all_columns, "operation": "remove_duplicates"}
                    }
                
                initial_rows = len(self.current_dataset)
                
                if column_name:
                    # Remove duplicates based on specific column
                    self.current_dataset = self.current_dataset.drop_duplicates(subset=[column_name])
                    removed_count = initial_rows - len(self.current_dataset)
                    self._log_operation(f"Removed {removed_count} duplicate rows based on {column_name}")
                    response_msg = f"✅ Removed **{removed_count}** duplicate rows based on column **{column_name}**. Dataset now has {len(self.current_dataset)} rows."
                else:
                    # Remove all duplicates
                    self.current_dataset = self.current_dataset.drop_duplicates()
                    removed_count = initial_rows - len(self.current_dataset)
                    self._log_operation(f"Removed {removed_count} duplicate rows")
                    response_msg = f"✅ Removed **{removed_count}** duplicate rows. Dataset now has {len(self.current_dataset)} rows."
                
                self.dataset_info = self._analyze_dataset()
                
                return {
                    "response": response_msg,
                    "type": "success",
                    "download_available": True
                }
            else:
                duplicate_count = self.current_dataset.duplicated().sum()
                return {
                    "response": f"📊 Found **{duplicate_count}** duplicate rows in the dataset.",
                    "type": "info"
                }
                
        except Exception as e:
            return {"response": f"Error handling duplicates: {str(e)}", "type": "error"}
    
    def _export_dataset(self, message: str) -> Dict[str, Any]:
        """Export current dataset"""
        try:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            filename = f"processed_dataset_{timestamp}.csv"
            filepath = os.path.join("uploads", filename)
            
            os.makedirs("uploads", exist_ok=True)
            self.current_dataset.to_csv(filepath, index=False)
            self._log_operation(f"Exported dataset as {filename}")
            
            return {
                "response": f"✅ Dataset exported successfully as **{filename}**",
                "type": "success",
                "download_url": f"/api/ai-assistant/download/{filename}",
                "filename": filename,
                "download_available": True
            }
            
        except Exception as e:
            return {"response": f"Error exporting dataset: {str(e)}", "type": "error"}
    
    def _extract_column_name(self, text: str) -> Optional[str]:
        """Extract column name from user message"""
        if not self.current_dataset is None:
            for col in self.current_dataset.columns:
                if col.lower() in text.lower():
                    return col
        return None
    
    def _extract_number(self, text: str) -> Optional[float]:
        """Extract number from text"""
        numbers = re.findall(r'-?\d+\.?\d*', text)
        if numbers:
            try:
                return float(numbers[0])
            except:
                return None
        return None
    
    def _log_operation(self, operation: str):
        """Log operations for history"""
        self.operation_history.append({
            "timestamp": datetime.now().isoformat(),
            "operation": operation
        })
    
    def get_operation_history(self) -> List[Dict[str, str]]:
        """Get operation history"""
        return self.operation_history
    
    def _calculate_std(self, message: str) -> Dict[str, Any]:
        """Calculate standard deviation of specified column"""
        column_name = self._extract_column_name(message)
        if not column_name:
            return {"response": "Please specify which column you want to calculate the standard deviation for.", "type": "error"}
        
        try:
            if column_name not in self.current_dataset.columns:
                return {"response": f"Column '{column_name}' not found in dataset.", "type": "error"}
            
            if not pd.api.types.is_numeric_dtype(self.current_dataset[column_name]):
                return {"response": f"Column '{column_name}' is not numeric. Cannot calculate standard deviation.", "type": "error"}
            
            std_value = self.current_dataset[column_name].std()
            self._log_operation(f"Calculated std of {column_name}: {std_value}")
            
            return {
                "response": f"📊 Standard Deviation of **{column_name}**: {round(std_value, 2)}",
                "type": "result",
                "value": std_value
            }
        except Exception as e:
            return {"response": f"Error calculating standard deviation: {str(e)}", "type": "error"}
    
    def _rename_column(self, message: str) -> Dict[str, Any]:
        """Rename column in dataset"""
        try:
            return {"response": "Column renaming feature coming soon!", "type": "info"}
        except Exception as e:
            return {"response": f"Error renaming column: {str(e)}", "type": "error"}
    
    def _calculate_correlation(self) -> Dict[str, Any]:
        """Calculate correlation matrix for numeric columns"""
        try:
            numeric_cols = self.current_dataset.select_dtypes(include=[np.number]).columns
            if len(numeric_cols) < 2:
                return {"response": "Need at least 2 numeric columns to calculate correlation.", "type": "error"}
            
            corr_matrix = self.current_dataset[numeric_cols].corr()
            self._log_operation("Calculated correlation matrix")
            
            response = "📊 **Correlation Matrix:**\n\n"
            for i, col1 in enumerate(numeric_cols):
                for j, col2 in enumerate(numeric_cols):
                    if i < j:
                        corr_val = corr_matrix.loc[col1, col2]
                        response += f"• **{col1}** vs **{col2}**: {round(corr_val, 3)}\n"
            
            return {
                "response": response,
                "type": "analysis",
                "data": corr_matrix.to_dict()
            }
            
        except Exception as e:
            return {"response": f"Error calculating correlation: {str(e)}", "type": "error"}
    
    def _get_unique_values(self, message: str) -> Dict[str, Any]:
        """Get unique values for specified column"""
        column_name = self._extract_column_name(message)
        if not column_name:
            # Show available columns for selection
            all_columns = self.current_dataset.columns.tolist()
            
            response = "🔢 **Show Unique Values - Select a Column:**\n\n"
            response += "Available columns:\n"
            for i, col in enumerate(all_columns, 1):
                unique_count = self.current_dataset[col].nunique()
                col_type = str(self.current_dataset[col].dtype)
                response += f"{i}. **{col}** ({col_type}) - {unique_count} unique values\n"
            
            response += "\n💡 **Usage:** Type 'show unique values in [column_name]'\n"
            response += "**Examples:**\n"
            for col in all_columns[:3]:
                response += f"• show unique values in {col}\n"
            
            return {
                "response": response,
                "type": "help",
                "data": {"available_columns": all_columns, "operation": "unique_values"}
            }
        
        return self._get_unique_values_for_column(column_name)
    
    def _show_history_options(self, message: str) -> Dict[str, Any]:
        """Show history analysis options"""
        try:
            response = "📚 **History Analysis Options:**\n\n"
            response += "I can help you analyze data from your processing history:\n\n"
            response += "🔍 **Available Commands:**\n"
            response += "• 'load from history' - Show your recent datasets\n"
            response += "• 'analyze history data' - Get insights from previous work\n"
            response += "• 'compare with history' - Compare current data with previous versions\n\n"
            response += "💡 **What I can do:**\n"
            response += "• Load previously processed datasets\n"
            response += "• Show your data cleaning history\n"
            response += "• Compare before/after statistics\n"
            response += "• Reapply previous operations\n"
            
            return {
                "response": response,
                "type": "help",
                "data": {"show_history_options": True}
            }
        except Exception as e:
            return {"response": f"Error accessing history: {str(e)}", "type": "error"}
    
    def get_current_dataset_info(self) -> Dict[str, Any]:
        """Get current dataset information"""
        if self.current_dataset is None:
            return {"error": "No dataset loaded"}
        
        return {
            "shape": self.current_dataset.shape,
            "columns": self.current_dataset.columns.tolist(),
            "dtypes": {str(k): str(v) for k, v in self.current_dataset.dtypes.to_dict().items()},
            "info": self.dataset_info
        }