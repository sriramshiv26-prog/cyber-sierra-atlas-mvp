import {
  getFileType,
  isSupportedFormat,
  shouldPreprocessFile,
  jsonToMarkdown,
  csvToMarkdown,
  convertToMarkdown,
  SupportedFormat,
} from '../../src/lib/markitdown-converter';

describe('MarkItDown Converter', () => {
  describe('getFileType', () => {
    it('should detect PDF files', () => {
      expect(getFileType('report.pdf')).toBe('pdf');
      expect(getFileType('Report.PDF')).toBe('pdf');
    });

    it('should detect Excel files', () => {
      expect(getFileType('data.xlsx')).toBe('xlsx');
      expect(getFileType('data.xls')).toBe('xlsx');
      expect(getFileType('Data.XLSX')).toBe('xlsx');
    });

    it('should detect Word files', () => {
      expect(getFileType('document.docx')).toBe('docx');
      expect(getFileType('document.doc')).toBe('docx');
      expect(getFileType('Document.DOCX')).toBe('docx');
    });

    it('should detect JSON files', () => {
      expect(getFileType('data.json')).toBe('json');
      expect(getFileType('Data.JSON')).toBe('json');
    });

    it('should detect CSV files', () => {
      expect(getFileType('data.csv')).toBe('csv');
      expect(getFileType('Data.CSV')).toBe('csv');
    });

    it('should detect HTML files', () => {
      expect(getFileType('page.html')).toBe('html');
      expect(getFileType('page.htm')).toBe('html');
      expect(getFileType('Page.HTML')).toBe('html');
    });

    it('should detect Markdown files', () => {
      expect(getFileType('readme.md')).toBe('md');
      expect(getFileType('readme.markdown')).toBe('md');
      expect(getFileType('README.MD')).toBe('md');
    });

    it('should detect text files', () => {
      expect(getFileType('notes.txt')).toBe('txt');
      expect(getFileType('notes.text')).toBe('txt');
      expect(getFileType('Notes.TXT')).toBe('txt');
    });

    it('should return null for unsupported formats', () => {
      expect(getFileType('image.png')).toBeNull();
      expect(getFileType('video.mp4')).toBeNull();
      expect(getFileType('archive.zip')).toBeNull();
    });

    it('should handle filenames with multiple dots', () => {
      expect(getFileType('my.report.pdf')).toBe('pdf');
      expect(getFileType('data.backup.json')).toBe('json');
    });
  });

  describe('isSupportedFormat', () => {
    it('should return true for supported formats', () => {
      expect(isSupportedFormat('report.pdf')).toBe(true);
      expect(isSupportedFormat('data.json')).toBe(true);
      expect(isSupportedFormat('data.csv')).toBe(true);
      expect(isSupportedFormat('document.docx')).toBe(true);
      expect(isSupportedFormat('page.html')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(isSupportedFormat('image.png')).toBe(false);
      expect(isSupportedFormat('video.mp4')).toBe(false);
      expect(isSupportedFormat('archive.zip')).toBe(false);
    });
  });

  describe('shouldPreprocessFile', () => {
    it('should return false for PDF files (handled natively)', () => {
      expect(shouldPreprocessFile('report.pdf')).toBe(false);
    });

    it('should return false for Markdown files (already structured)', () => {
      expect(shouldPreprocessFile('readme.md')).toBe(false);
    });

    it('should return true for formats that need preprocessing', () => {
      expect(shouldPreprocessFile('data.json')).toBe(true);
      expect(shouldPreprocessFile('data.csv')).toBe(true);
      expect(shouldPreprocessFile('page.html')).toBe(true);
      expect(shouldPreprocessFile('notes.txt')).toBe(true);
      expect(shouldPreprocessFile('document.docx')).toBe(true);
      expect(shouldPreprocessFile('data.xlsx')).toBe(true);
    });

    it('should return false for unsupported formats', () => {
      expect(shouldPreprocessFile('image.png')).toBe(false);
    });
  });

  describe('jsonToMarkdown', () => {
    it('should convert simple JSON object to Markdown', () => {
      const json = '{"name": "John", "age": 30}';
      const markdown = jsonToMarkdown(json);
      expect(markdown).toContain('**name:**');
      expect(markdown).toContain('John');
      expect(markdown).toContain('**age:**');
      expect(markdown).toContain('30');
    });

    it('should handle JSON arrays', () => {
      const json = '["item1", "item2", "item3"]';
      const markdown = jsonToMarkdown(json);
      expect(markdown).toContain('- item1');
      expect(markdown).toContain('- item2');
      expect(markdown).toContain('- item3');
    });

    it('should handle nested JSON objects', () => {
      const json = '{"user": {"name": "John", "email": "john@example.com"}}';
      const markdown = jsonToMarkdown(json);
      expect(markdown).toContain('**user:**');
      expect(markdown).toContain('**name:**');
      expect(markdown).toContain('John');
    });

    it('should handle arrays of objects', () => {
      const json = '[{"id": 1, "name": "Item1"}, {"id": 2, "name": "Item2"}]';
      const markdown = jsonToMarkdown(json);
      expect(markdown).toContain('**id:**');
      expect(markdown).toContain('Item1');
      expect(markdown).toContain('Item2');
    });

    it('should handle null/undefined values', () => {
      const json = '{"field1": null, "field2": "value"}';
      const markdown = jsonToMarkdown(json);
      expect(markdown).toContain('**field2:**');
      expect(markdown).toContain('value');
    });

    it('should return wrapped code block for invalid JSON', () => {
      const invalidJson = '{invalid json}';
      const markdown = jsonToMarkdown(invalidJson);
      expect(markdown).toContain('```json');
      expect(markdown).toContain(invalidJson);
    });

    it('should handle JSON with mixed types', () => {
      const json = '{"name": "Test", "count": 5, "active": true, "tags": ["a", "b"]}';
      const markdown = jsonToMarkdown(json);
      expect(markdown).toContain('**name:**');
      expect(markdown).toContain('Test');
      expect(markdown).toContain('**count:**');
      expect(markdown).toContain('5');
      expect(markdown).toContain('**active:**');
      expect(markdown).toContain('true');
    });
  });

  describe('csvToMarkdown', () => {
    it('should convert simple CSV to Markdown table', () => {
      const csv = 'Name,Age,City\nJohn,30,New York\nJane,25,Los Angeles';
      const markdown = csvToMarkdown(csv);
      expect(markdown).toContain('| Name | Age | City |');
      expect(markdown).toContain('| --- | --- | --- |');
      expect(markdown).toContain('| John | 30 | New York |');
      expect(markdown).toContain('| Jane | 25 | Los Angeles |');
    });

    it('should handle CSV with single row (headers only)', () => {
      const csv = 'Name,Age,City';
      const markdown = csvToMarkdown(csv);
      expect(markdown).toContain('| Name | Age | City |');
      expect(markdown).toContain('| --- | --- | --- |');
    });

    it('should handle CSV with extra spaces', () => {
      const csv = 'Name , Age , City\n John , 30 , New York';
      const markdown = csvToMarkdown(csv);
      expect(markdown).toContain('| Name | Age | City |');
      expect(markdown).toContain('| John | 30 | New York |');
    });

    it('should pad missing columns', () => {
      const csv = 'A,B,C\n1,2\n3,4,5,6';
      const markdown = csvToMarkdown(csv);
      const lines = markdown.split('\n');
      // Each line should have the same number of pipes
      const pipeCount = lines[0].split('|').length;
      lines.forEach(line => {
        expect(line.split('|').length).toBe(pipeCount);
      });
    });

    it('should handle empty CSV', () => {
      const csv = '';
      const markdown = csvToMarkdown(csv);
      expect(markdown).toBe('');
    });

    it('should handle CSV with numeric and text data', () => {
      const csv = 'ID,Title,Severity\n1,Finding 1,High\n2,Finding 2,Critical';
      const markdown = csvToMarkdown(csv);
      expect(markdown).toContain('| ID | Title | Severity |');
      expect(markdown).toContain('| 1 | Finding 1 | High |');
      expect(markdown).toContain('| 2 | Finding 2 | Critical |');
    });
  });

  describe('convertToMarkdown', () => {
    it('should convert JSON format', () => {
      const json = '{"key": "value"}';
      const result = convertToMarkdown(json, 'data.json');
      expect(result).toContain('**key:**');
      expect(result).toContain('value');
    });

    it('should convert CSV format', () => {
      const csv = 'A,B\n1,2';
      const result = convertToMarkdown(csv, 'data.csv');
      expect(result).toContain('| A | B |');
      expect(result).toContain('| --- | --- |');
    });

    it('should handle HTML format', () => {
      const html = '<h1>Title</h1><p>Content here</p>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).toContain('# Title');
      expect(result).toContain('Content here');
    });

    it('should pass through text format', () => {
      const text = 'Just plain text';
      const result = convertToMarkdown(text, 'notes.txt');
      expect(result).toBe(text);
    });

    it('should pass through markdown format', () => {
      const markdown = '# Title\n\nContent';
      const result = convertToMarkdown(markdown, 'readme.md');
      expect(result).toBe(markdown);
    });

    it('should handle case-insensitive filenames', () => {
      const json = '{"key": "value"}';
      const result1 = convertToMarkdown(json, 'data.json');
      const result2 = convertToMarkdown(json, 'data.JSON');
      expect(result1).toBe(result2);
    });

    it('should handle unsupported formats by returning as-is', () => {
      const content = 'some content';
      const result = convertToMarkdown(content, 'file.unknown');
      expect(result).toBe(content);
    });
  });

  describe('HTML to Markdown conversion edge cases', () => {
    it('should remove script tags', () => {
      const html = '<p>Content</p><script>alert("test")</script><p>More</p>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).not.toContain('alert');
      expect(result).toContain('Content');
      expect(result).toContain('More');
    });

    it('should remove style tags', () => {
      const html = '<style>body { color: red; }</style><p>Content</p>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).not.toContain('color: red');
      expect(result).toContain('Content');
    });

    it('should convert links to Markdown', () => {
      const html = '<a href="https://example.com">Click here</a>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).toContain('[Click here]');
      expect(result).toContain('https://example.com');
    });

    it('should convert emphasis tags', () => {
      const html = '<strong>Bold</strong> and <em>italic</em>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).toContain('**Bold**');
      expect(result).toContain('*italic*');
    });

    it('should decode HTML entities', () => {
      const html = '<p>&quot;Hello&quot; &amp; goodbye</p>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).toContain('"Hello"');
      expect(result).toContain('&');
      expect(result).toContain('goodbye');
    });

    it('should handle multiple headings', () => {
      const html = '<h1>H1</h1><h2>H2</h2><h3>H3</h3>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).toContain('# H1');
      expect(result).toContain('## H2');
      expect(result).toContain('### H3');
    });

    it('should convert lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).toContain('- Item 1');
      expect(result).toContain('- Item 2');
    });

    it('should clean excessive whitespace', () => {
      const html = '<p>Line 1</p>\n\n\n\n<p>Line 2</p>';
      const result = convertToMarkdown(html, 'page.html');
      expect(result).not.toContain('\n\n\n');
    });
  });

  describe('Integration tests', () => {
    it('should handle real-world JSON audit findings', () => {
      const json = JSON.stringify({
        findings: [
          { id: 1, title: 'SQL Injection', severity: 'Critical' },
          { id: 2, title: 'XSS', severity: 'High' },
        ],
        summary: { total: 2, criticals: 1 },
      });
      const markdown = jsonToMarkdown(json);
      // Check that the content includes key information
      expect(markdown).toContain('findings');
      expect(markdown).toContain('title');
      expect(markdown).toContain('severity');
      expect(markdown).toContain('summary');
    });

    it('should handle real-world CSV audit data', () => {
      const csv = `ID,Finding,Severity,Status
1,SQL Injection,Critical,Open
2,Weak Authentication,High,In Progress
3,Missing Encryption,Medium,Closed`;
      const markdown = csvToMarkdown(csv);
      expect(markdown).toContain('| ID | Finding | Severity | Status |');
      expect(markdown).toContain('SQL Injection');
      expect(markdown).toContain('Critical');
    });
  });
});
