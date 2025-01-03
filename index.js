const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = 3000;

// Path to the Projects folder
const PROJECTS_DIR = path.join(__dirname, 'Projects');

// Middleware to serve static files
app.use('/static', express.static(PROJECTS_DIR));

// Utility function to read a file safely
const readFileSafe = (filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(`Error reading file: ${filePath}`, err);
    }
    return null;
  }
};

// Utility function to get description from a file
const getDescription = (descriptionPath, fileName = null) => {
  const description = readFileSafe(descriptionPath);
  if (!description) return null;

  if (fileName) {
    const regex = new RegExp(`^${fileName}=(.*)$`, 'm');
    const match = description.match(regex);
    return match ? match[1].trim() : null;
  }

  return description
    .split('\n')
    .filter((line) => !line.includes('='))
    .join('\n');
};

// Route to display all projects
app.get('/', (req, res) => {
  const projects = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const projectLinks = projects
    .map(
      (project) => `<li><a href="/project/${project}">${project}</a></li>`
    )
    .join('');

  res.send(`
    <html>
      <head>
        <title>Projects</title>
      </head>
      <body>
        <h1>Projects</h1>
        <ul>${projectLinks}</ul>
      </body>
    </html>
  `);
});

// Route to display a project's contents
app.get('/project/:projectName', (req, res) => {
  const projectName = req.params.projectName;
  const projectPath = path.join(PROJECTS_DIR, projectName);

  if (!fs.existsSync(projectPath) || !fs.statSync(projectPath).isDirectory()) {
    return res.status(404).send('Project not found');
  }

  const descriptionFile = path.join(projectPath, 'description.txt');
  const description = getDescription(descriptionFile);

  const subdirectories = fs.readdirSync(projectPath, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  const files = fs.readdirSync(projectPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile() && dirent.name !== 'description.txt')
    .map((dirent) => dirent.name);

  const subdirectoryLinks = subdirectories.length > 0
    ? `<h2>Subdirectories</h2><ul>${subdirectories
        .map(
          (subdir) => `<li><a href="/project/${projectName}/subdir/${encodeURIComponent(subdir)}">${subdir}</a></li>`
        )
        .join('')}</ul>`
    : '';

  const fileLinks = files.length > 0
    ? `<h2>Files</h2><ul>${files
        .map(
          (file) => `<li><a href="/project/${projectName}/file/${encodeURIComponent(file)}">${file}</a></li>`
        )
        .join('')}</ul>`
    : '';

  res.send(`
    <html>
      <head>
        <title>${projectName}</title>
      </head>
      <body>
        <h1>${projectName}</h1>
        <h2>Description</h2>
        ${description ? `<b>Description</b> - <a href="/static/${projectName}/description.txt">description.txt</a>` : '<b>Description</b><p>No description is available.</p>'}
        ${subdirectoryLinks}
        ${fileLinks}
        <a href="/">Back to Projects</a>
      </body>
    </html>
  `);
});

// Route to display subdirectory contents
app.get('/project/:projectName/subdir/:subdirName', (req, res) => {
  const { projectName, subdirName } = req.params;
  const subdirPath = path.join(PROJECTS_DIR, projectName, subdirName);

  if (!fs.existsSync(subdirPath) || !fs.statSync(subdirPath).isDirectory()) {
    return res.status(404).send('Subdirectory not found');
  }

  const descriptionFile = path.join(subdirPath, 'description.txt');
  const description = getDescription(descriptionFile);

  const files = fs.readdirSync(subdirPath, { withFileTypes: true })
    .filter((dirent) => dirent.isFile())
    .map((dirent) => dirent.name);

  const fileLinks = files.length > 0
    ? `<h2>Files</h2><ul>${files
        .map(
          (file) => `<li><a href="/project/${projectName}/subdir/${encodeURIComponent(subdirName)}/file/${encodeURIComponent(file)}">${file}</a></li>`
        )
        .join('')}</ul>`
    : '';

  res.send(`
    <html>
      <head>
        <title>${subdirName}</title>
      </head>
      <body>
        <h1>${subdirName}</h1>
        <h2>Description</h2>
        ${description ? `<b>Description</b> - <a href="/static/${projectName}/${subdirName}/description.txt">description.txt</a>` : '<b>Description</b><p>No description is available.</p>'}
        ${fileLinks}
        <a href="/project/${projectName}">Back to Project</a>
      </body>
    </html>
  `);
});

// Route to display file contents
app.get('/project/:projectName/file/:fileName', (req, res) => {
  const { projectName, fileName } = req.params;
  const filePath = path.join(PROJECTS_DIR, projectName, fileName);
  const descriptionFile = path.join(PROJECTS_DIR, projectName, 'description.txt');

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send('File not found');
  }

  const fileDescription = getDescription(descriptionFile, fileName) || '';
  const fileContents = readFileSafe(filePath);

  res.send(`
    <html>
      <head>
        <title>${fileName}</title>
      </head>
      <body>
        <h1>${fileName}</h1>
        <h2>Description</h2>
        <p>${fileDescription}</p>
        <h2>Contents</h2>
        <pre>${fileContents}</pre>
        <a href="/project/${projectName}">Back to Project</a>
      </body>
    </html>
  `);
});

// Route to display subdirectory file contents
app.get('/project/:projectName/subdir/:subdirName/file/:fileName', (req, res) => {
  const { projectName, subdirName, fileName } = req.params;
  const filePath = path.join(PROJECTS_DIR, projectName, subdirName, fileName);
  const descriptionFile = path.join(PROJECTS_DIR, projectName, subdirName, 'description.txt');

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return res.status(404).send('File not found');
  }

  const fileDescription = getDescription(descriptionFile, fileName) || '';
  const fileContents = readFileSafe(filePath);

  res.send(`
    <html>
      <head>
        <title>${fileName}</title>
      </head>
      <body>
        <h1>${fileName}</h1>
        <h2>Description</h2>
        <p>${fileDescription}</p>
        <h2>Contents</h2>
        <pre>${fileContents}</pre>
        <a href="/project/${projectName}/subdir/${subdirName}">Back to Subdirectory</a>
      </body>
    </html>
  `);
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
