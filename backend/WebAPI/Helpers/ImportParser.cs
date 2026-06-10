using System.Text.Json;

namespace WebAPI.Helpers
{
    public static class ImportParser
    {
        public static async Task<(List<Dictionary<string, string>> rows, string? error)> ParseAsync(IFormFile file)
        {
            var ext = Path.GetExtension(file.FileName).ToLowerInvariant();
            using var reader = new StreamReader(file.OpenReadStream());
            var content = await reader.ReadToEndAsync();

            if (ext == ".json")
                return ParseJson(content);
            if (ext == ".csv")
                return ParseCsv(content);

            return (new List<Dictionary<string, string>>(), $"Unsupported file type: {ext}. Use .csv or .json");
        }

        private static (List<Dictionary<string, string>>, string?) ParseCsv(string content)
        {
            var rows = new List<Dictionary<string, string>>();
            var lines = content.Split('\n', StringSplitOptions.RemoveEmptyEntries);
            if (lines.Length < 2)
                return (rows, "CSV must have a header row and at least one data row.");

            var headers = SplitCsvLine(lines[0].Trim());

            for (int i = 1; i < lines.Length; i++)
            {
                var line = lines[i].Trim();
                if (string.IsNullOrWhiteSpace(line)) continue;
                var values = SplitCsvLine(line);
                var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                for (int j = 0; j < headers.Count; j++)
                    row[headers[j]] = j < values.Count ? values[j] : string.Empty;
                rows.Add(row);
            }
            return (rows, null);
        }

        private static List<string> SplitCsvLine(string line)
        {
            var fields = new List<string>();
            var field = new System.Text.StringBuilder();
            bool inQuotes = false;
            for (int i = 0; i < line.Length; i++)
            {
                char c = line[i];
                if (inQuotes)
                {
                    if (c == '"' && i + 1 < line.Length && line[i + 1] == '"') { field.Append('"'); i++; }
                    else if (c == '"') inQuotes = false;
                    else field.Append(c);
                }
                else if (c == '"') inQuotes = true;
                else if (c == ',') { fields.Add(field.ToString()); field.Clear(); }
                else field.Append(c);
            }
            fields.Add(field.ToString());
            return fields;
        }

        private static (List<Dictionary<string, string>>, string?) ParseJson(string content)
        {
            try
            {
                var rows = new List<Dictionary<string, string>>();
                var elements = JsonSerializer.Deserialize<JsonElement[]>(content);
                if (elements == null)
                    return (rows, "Invalid JSON array.");

                foreach (var el in elements)
                {
                    var row = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
                    foreach (var prop in el.EnumerateObject())
                        row[prop.Name] = prop.Value.ToString();
                    rows.Add(row);
                }
                return (rows, null);
            }
            catch (Exception ex)
            {
                return (new List<Dictionary<string, string>>(), $"JSON parse error: {ex.Message}");
            }
        }

        public static string Get(Dictionary<string, string> row, params string[] keys)
        {
            foreach (var key in keys)
                if (row.TryGetValue(key, out var v) && !string.IsNullOrWhiteSpace(v))
                    return v.Trim();
            return string.Empty;
        }
    }
}
