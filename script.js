// Digital OS Portfolio - Main JavaScript
class DigitalOS {
  constructor() {
    this.currentPersona = null
    this.openWindows = new Map()
    this.windowZIndex = 100
    this.notifications = []
    this.theme = localStorage.getItem("theme") || "dark"

    this.init()
  }

  init() {
    this.setupEventListeners()
    this.setupParticles()
    this.updateClock()
    this.applyTheme()

    // Check for saved persona
    const savedPersona = localStorage.getItem("persona")
    if (savedPersona) {
      this.currentPersona = savedPersona
      this.showDesktop()
    } else {
      this.showLockScreen()
    }
  }

  setupEventListeners() {
    console.log("[v0] Setting up event listeners")

    // Persona selection
    document.querySelectorAll(".persona-card").forEach((card) => {
      card.addEventListener("click", (e) => this.selectPersona(e.target.closest(".persona-card")))
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          this.selectPersona(e.target.closest(".persona-card"))
        }
      })
    })

    document.querySelectorAll(".desktop-icon").forEach((icon) => {
      console.log("[v0] Setting up icon listener for:", icon.dataset.app)

      icon.addEventListener("click", (e) => {
        e.preventDefault()
        e.stopPropagation()
        const appName = e.currentTarget.dataset.app
        console.log("[v0] Desktop icon clicked:", appName)
        if (appName) {
          this.openApp(appName)
        } else {
          console.log("[v0] No app name found for icon")
        }
      })

      icon.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault()
          const appName = e.currentTarget.dataset.app
          console.log("[v0] Desktop icon keyboard activated:", appName)
          if (appName) {
            this.openApp(appName)
          }
        }
      })
    })

    // Start button
    document.getElementById("startButton").addEventListener("click", () => this.toggleLauncher())

    document.getElementById("logoutButton").addEventListener("click", () => this.logout())

    // Theme toggle
    document.getElementById("themeToggle").addEventListener("click", () => this.toggleTheme())

    // Launcher apps
    document.querySelectorAll(".launcher-app").forEach((app) => {
      app.addEventListener("click", (e) => {
        const appName = e.target.closest(".launcher-app").dataset.app
        this.openApp(appName)
        this.hideLauncher()
      })
    })

    // Launcher search
    document.getElementById("launcherSearch").addEventListener("input", (e) => this.filterLauncher(e.target.value))

    // Close launcher when clicking outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".launcher") && !e.target.closest(".start-button")) {
        this.hideLauncher()
      }
    })

    // Keyboard shortcuts
    document.addEventListener("keydown", (e) => this.handleKeyboard(e))

    // Initialize particle animation
    this.initParticles()
    this.updateTime()
    setInterval(() => this.updateTime(), 1000)
  }

  selectPersona(card) {
    const persona = card.dataset.persona
    this.currentPersona = persona
    localStorage.setItem("persona", persona)

    this.showNotification("Welcome!", `Logged in as ${persona}`)
    this.showDesktop()

    this.setupPersonaDesktop(persona)

    // Auto-open windows based on persona
    setTimeout(() => {
      switch (persona) {
        case "recruiter":
          this.openApp("resume")
          setTimeout(() => this.openApp("contact"), 500)
          break
        case "developer":
          this.openApp("projects")
          setTimeout(() => this.openApp("terminal"), 500)
          break
        case "guest":
          this.openApp("about")
          break
      }
    }, 1000)
  }

  setupPersonaDesktop(persona) {
    const desktopIcons = document.querySelector(".desktop-icons")
    const icons = desktopIcons.querySelectorAll(".desktop-icon")

    // Reset all icons to visible
    icons.forEach((icon) => {
      icon.style.display = "flex"
      icon.style.opacity = "1"
    })

    // Customize based on persona
    switch (persona) {
      case "recruiter":
        // Hide terminal and blog for recruiters
        icons.forEach((icon) => {
          if (icon.dataset.app === "terminal" || icon.dataset.app === "blog") {
            icon.style.opacity = "0.5"
          }
        })
        break
      case "developer":
        // Highlight technical apps for developers
        icons.forEach((icon) => {
          if (icon.dataset.app === "projects" || icon.dataset.app === "terminal") {
            icon.style.transform = "scale(1.1)"
            icon.style.filter = "drop-shadow(0 0 10px rgba(0, 255, 255, 0.3))"
          }
        })
        break
      case "guest":
        // Hide terminal for guests
        icons.forEach((icon) => {
          if (icon.dataset.app === "terminal") {
            icon.style.display = "none"
          }
        })
        break
    }
  }

  logout() {
    localStorage.removeItem("persona")
    this.currentPersona = null

    // Close all windows
    this.openWindows.forEach((window, appName) => {
      this.closeWindow(appName)
    })

    // Reset desktop
    const desktopIcons = document.querySelector(".desktop-icons")
    const icons = desktopIcons.querySelectorAll(".desktop-icon")
    icons.forEach((icon) => {
      icon.style.display = "flex"
      icon.style.opacity = "1"
      icon.style.transform = "scale(1)"
      icon.style.filter = "none"
    })

    this.showNotification("Logged out", "Choose your experience again")
    this.showLockScreen()
  }

  showLockScreen() {
    document.getElementById("lockScreen").classList.add("active")
    document.getElementById("desktop").classList.remove("active")
  }

  showDesktop() {
    document.getElementById("lockScreen").classList.remove("active")
    document.getElementById("desktop").classList.add("active")
  }

  openApp(appName) {
    console.log("[v0] Opening app:", appName)

    if (!appName) {
      console.log("[v0] No app name provided")
      return
    }

    // Check if window already exists
    if (this.openWindows.has(appName)) {
      console.log("[v0] Window already exists, focusing:", appName)
      const existingWindow = document.getElementById(`window-${appName}`)
      if (existingWindow) {
        this.focusWindow(existingWindow)
        // Restore if minimized
        if (existingWindow.classList.contains("minimized")) {
          existingWindow.classList.remove("minimized")
        }
      }
      return
    }

    console.log("[v0] Creating new window for:", appName)

    const window = this.createWindow(appName)
    this.openWindows.set(appName, window)
    this.updateTaskbar()

    // Animate window in
    setTimeout(() => window.classList.add("active"), 100)
  }

  createWindow(appName) {
    console.log("[v0] Creating window for:", appName)

    const window = document.createElement("div")
    window.className = "window"
    window.id = `window-${appName}`
    window.style.position = "absolute"
    window.style.left = `${50 + this.openWindows.size * 30}px`
    window.style.top = `${50 + this.openWindows.size * 30}px`
    window.style.zIndex = ++this.windowZIndex

    const header = document.createElement("div")
    header.className = "window-header"
    header.innerHTML = `
            <div class="window-title">
                <span class="window-icon">${this.getAppIcon(appName)}</span>
                ${this.getAppTitle(appName)}
            </div>
            <div class="window-controls">
                <button class="window-control minimize" aria-label="Minimize"></button>
                <button class="window-control maximize" aria-label="Maximize"></button>
                <button class="window-control close" aria-label="Close"></button>
            </div>
        `

    const content = document.createElement("div")
    content.className = "window-content"
    content.innerHTML = this.getAppContent(appName)

    window.appendChild(header)
    window.appendChild(content)

    // Window controls
    header.querySelector(".close").addEventListener("click", () => this.closeWindow(appName))
    header.querySelector(".minimize").addEventListener("click", () => this.minimizeWindow(appName))
    header.querySelector(".maximize").addEventListener("click", () => this.toggleMaximize(appName))

    // Make window draggable
    console.log("[v0] Setting up dragging for window:", appName)
    this.makeDraggable(window, header)

    // Focus on click
    window.addEventListener("mousedown", () => this.focusWindow(window))

    document.getElementById("windowsContainer").appendChild(window)

    // Initialize app-specific functionality
    this.initializeApp(appName, content)

    return window
  }

  getAppIcon(appName) {
    const icons = {
      resume: "📄",
      projects: "🚀",
      about: "👨‍💻",
      contact: "📧",
      blog: "📝",
      terminal: "⚡",
    }
    return icons[appName] || "📱"
  }

  getAppTitle(appName) {
    const titles = {
      resume: "Resume",
      projects: "Projects",
      about: "About Me",
      contact: "Contact",
      blog: "Blog",
      terminal: "Terminal",
    }
    return titles[appName] || appName
  }

  getAppContent(appName) {
    switch (appName) {
      case "resume":
        return `
                    <div class="resume-content">
                        <div class="resume-header">
                            <h1 class="resume-name">Mrigendra</h1>
                            <p class="resume-title">Full Stack Developer & IT Specialist</p>
                            <p class="resume-summary">Passionate developer with expertise in modern web technologies, mobile development, and system administration. Dedicated to creating innovative solutions and exceptional user experiences.</p>
                        </div>
                        
                        <div class="resume-section">
                            <h3>Skills</h3>
                            <div class="skills-grid">
                                <div class="skill-tag">JavaScript</div>
                                <div class="skill-tag">Python</div>
                                <div class="skill-tag">Java</div>
                                <div class="skill-tag">React</div>
                                <div class="skill-tag">Node.js</div>
                                <div class="skill-tag">MongoDB</div>
                                <div class="skill-tag">PostgreSQL</div>
                                <div class="skill-tag">Docker</div>
                                <div class="skill-tag">AWS</div>
                                <div class="skill-tag">Git</div>
                            </div>
                        </div>
                        
                        <div class="resume-section">
                            <h3>Experience</h3>
                            <div class="experience-item">
                                <div class="experience-title">CSR</div>
                                <div class="experience-company">Kantipur Management(Ncell project</div>
                                <div class="experience-date">2024 - 2025</div>
                                <div class="experience-desc">Worked as a Customer Service Representative (CSR), handling client queries through multi-channel communication, maintaining CRM records, and ensuring SLA adherence while resolving technical and non-technical issues.</div>
                            </div>
                        
                        <div class="resume-section">
                            <h3>Education</h3>
                            <div class="experience-item">
                                <div class="experience-title">Bachelor of Computer Science</div>
                                <div class="experience-company">IIMS college</div>
                                <div class="experience-date">2023-Present</div>
                                <div class="experience-desc">Pursuing Bachelor of Computer Science (BCS), developing strong analytical, problem-solving, and technical skills for software and system development.</div>
                            </div>
                        </div>
                        
                        <div class="resume-actions">
                            <a href="#" class="btn btn-primary">Download PDF</a>
                            <a href="#" class="btn btn-secondary">Email Me</a>
                        </div>
                    </div>
                `

      case "projects":
        return `
                    <div class="projects-content">
                        <div class="projects-filters">
                            <div class="filter-chip active" data-filter="all">All</div>
                            <div class="filter-chip" data-filter="web">Web</div>
                            <div class="filter-chip" data-filter="mobile">Mobile</div>
                            <div class="filter-chip" data-filter="desktop">Desktop</div>
                            <div class="filter-chip" data-filter="ai">AI/ML</div>
                        </div>
                        
                        <div class="projects-grid">
                            <div class="project-card" data-category="web">
                                <div class="project-image">🌐</div>
                                <h3 class="project-title">E-Commerce Platform</h3>
                                <div class="project-stack">
                                    <span class="stack-tag">React</span>
                                    <span class="stack-tag">Node.js</span>
                                    <span class="stack-tag">MongoDB</span>
                                </div>
                                <p class="project-desc">Full-featured e-commerce platform with payment integration, inventory management, and admin dashboard.</p>
                            </div>
                            
                            <div class="project-card" data-category="mobile">
                                <div class="project-image">📱</div>
                                <h3 class="project-title">Fitness Tracker App</h3>
                                <div class="project-stack">
                                    <span class="stack-tag">React Native</span>
                                    <span class="stack-tag">Firebase</span>
                                    <span class="stack-tag">Redux</span>
                                </div>
                                <p class="project-desc">Cross-platform mobile app for tracking workouts, nutrition, and health metrics with social features.</p>
                            </div>
                            
                            <div class="project-card" data-category="web">
                                <div class="project-image">📊</div>
                                <h3 class="project-title">Analytics Dashboard</h3>
                                <div class="project-stack">
                                    <span class="stack-tag">Vue.js</span>
                                    <span class="stack-tag">D3.js</span>
                                    <span class="stack-tag">Python</span>
                                </div>
                                <p class="project-desc">Real-time analytics dashboard with interactive charts and data visualization for business intelligence.</p>
                            </div>
                            
                            <div class="project-card" data-category="ai">
                                <div class="project-image">🤖</div>
                                <h3 class="project-title">AI Chatbot</h3>
                                <div class="project-stack">
                                    <span class="stack-tag">Python</span>
                                    <span class="stack-tag">TensorFlow</span>
                                    <span class="stack-tag">NLP</span>
                                </div>
                                <p class="project-desc">Intelligent chatbot using natural language processing for customer support automation.</p>
                            </div>
                            
                            <div class="project-card" data-category="desktop">
                                <div class="project-image">💻</div>
                                <h3 class="project-title">Code Editor</h3>
                                <div class="project-stack">
                                    <span class="stack-tag">Electron</span>
                                    <span class="stack-tag">JavaScript</span>
                                    <span class="stack-tag">CSS</span>
                                </div>
                                <p class="project-desc">Lightweight code editor with syntax highlighting, themes, and plugin support for multiple languages.</p>
                            </div>
                            
                            <div class="project-card" data-category="web">
                                <div class="project-image">🎵</div>
                                <h3 class="project-title">Music Streaming App</h3>
                                <div class="project-stack">
                                    <span class="stack-tag">Angular</span>
                                    <span class="stack-tag">Express</span>
                                    <span class="stack-tag">PostgreSQL</span>
                                </div>
                                <p class="project-desc">Music streaming platform with playlist management, social features, and recommendation engine.</p>
                            </div>
                        </div>
                    </div>
                `

      case "about":
        return `
                    <div class="about-content">
                        <div class="about-header">
                            <div class="about-avatar">👨‍💻</div>
                            <div class="about-intro">
                                <h2>Hi, I'm Mrigendra!</h2>
                                <p>A passionate full-stack developer with a love for creating innovative digital experiences. I specialize in modern web technologies and enjoy solving complex problems through code.</p>
                            </div>
                        </div>
                        
                        <div class="about-section">
                            <h3>What I Do</h3>
                            <p>I'm a versatile developer who works across the entire technology stack. From crafting beautiful user interfaces to building robust backend systems, I enjoy every aspect of software development. My experience spans web development, mobile applications, and system administration.</p>
                        </div>
                        
                        <div class="about-section">
                            <h3>Interests</h3>
                            <div class="interests-list">
                                <div class="interest-tag">🖥️ IT & Technology</div>
                                <div class="interest-tag">📱 Mobile Development</div>
                                <div class="interest-tag">🎵 Music Production</div>
                                <div class="interest-tag">🎮 Game Development</div>
                                <div class="interest-tag">🤖 Artificial Intelligence</div>
                                <div class="interest-tag">☁️ Cloud Computing</div>
                            </div>
                        </div>
                        
                        <div class="about-section">
                            <h3>Philosophy</h3>
                            <p>I believe in writing clean, maintainable code and creating user experiences that are both functional and delightful. Continuous learning is at the core of my approach - the tech world evolves rapidly, and I love staying at the forefront of new developments.</p>
                        </div>
                        
                        <div class="about-section">
                            <h3>When I'm Not Coding</h3>
                            <p>You'll find me exploring new music, experimenting with audio production, or diving into the latest tech trends. I'm also passionate about mentoring other developers and contributing to open-source projects.</p>
                        </div>
                    </div>
                `

      case "contact":
        return `
                   <div class="contact-content">
  <h2>Let's Connect!</h2>
  <p>I'm always interested in new opportunities and collaborations. Feel free to reach out!</p>
  
  <div class="social-links">
    <!-- Email -->
    <a href="mailto:mrigendra.baidhya@gmail.com" class="social-link">
      <span>📧</span>
      <span>mrigendra.baidhya@gmail.com</span>
    </a>

    <!-- LinkedIn -->
    <a href="https://www.linkedin.com/in/mrigendra-man-baidhya/" target="_blank" rel="noopener noreferrer" class="social-link">
      <span>💼</span>
      <span>LinkedIn</span>
    </a>

    <!-- GitHub -->
    <a href="https://github.com/pervmax" target="_blank" rel="noopener noreferrer" class="social-link">
      <span>🐙</span>
      <span>GitHub</span>
    </a>
  </div>
</div>

                        
                        <form class="contact-form">
                            <div class="form-group">
                                <label class="form-label">Name</label>
                                <input type="text" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Email</label>
                                <input type="email" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Subject</label>
                                <input type="text" class="form-input" required>
                            </div>
                            <div class="form-group">
                                <label class="form-label">Message</label>
                                <textarea class="form-textarea" required></textarea>
                            </div>
                            <button type="submit" class="btn btn-primary">Send Message</button>
                        </form>
                    </div>
                `

      case "blog":
        return `
                    <div class="blog-content">
                        <h2>Latest Posts</h2>
                        <div class="blog-posts">
                            <article class="blog-post">
                                <h3 class="blog-post-title">Building Scalable Web Applications</h3>
                                <div class="blog-post-meta">
                                    <span>January 15, 2024</span>
                                    <span>5 min read</span>
                                </div>
                                <div class="blog-post-tags">
                                    <span class="blog-tag">Web Development</span>
                                    <span class="blog-tag">Architecture</span>
                                </div>
                                <p class="blog-post-excerpt">Exploring best practices for building web applications that can handle growth and scale effectively...</p>
                            </article>
                            
                            <article class="blog-post">
                                <h3 class="blog-post-title">The Future of Mobile Development</h3>
                                <div class="blog-post-meta">
                                    <span>January 8, 2024</span>
                                    <span>7 min read</span>
                                </div>
                                <div class="blog-post-tags">
                                    <span class="blog-tag">Mobile</span>
                                    <span class="blog-tag">React Native</span>
                                </div>
                                <p class="blog-post-excerpt">A deep dive into emerging trends and technologies shaping the future of mobile app development...</p>
                            </article>
                            
                            <article class="blog-post">
                                <h3 class="blog-post-title">AI Integration in Modern Apps</h3>
                                <div class="blog-post-meta">
                                    <span>December 28, 2023</span>
                                    <span>6 min read</span>
                                </div>
                                <div class="blog-post-tags">
                                    <span class="blog-tag">AI</span>
                                    <span class="blog-tag">Machine Learning</span>
                                </div>
                                <p class="blog-post-excerpt">How to effectively integrate AI capabilities into your applications without overwhelming users...</p>
                            </article>
                            
                            <article class="blog-post">
                                <h3 class="blog-post-title">Clean Code Principles</h3>
                                <div class="blog-post-meta">
                                    <span>December 20, 2023</span>
                                    <span>4 min read</span>
                                </div>
                                <div class="blog-post-tags">
                                    <span class="blog-tag">Best Practices</span>
                                    <span class="blog-tag">Code Quality</span>
                                </div>
                                <p class="blog-post-excerpt">Essential principles for writing maintainable, readable, and efficient code that stands the test of time...</p>
                            </article>
                            
                            <article class="blog-post">
                                <h3 class="blog-post-title">Getting Started with Cloud Computing</h3>
                                <div class="blog-post-meta">
                                    <span>December 12, 2023</span>
                                    <span>8 min read</span>
                                </div>
                                <div class="blog-post-tags">
                                    <span class="blog-tag">Cloud</span>
                                    <span class="blog-tag">AWS</span>
                                </div>
                                <p class="blog-post-excerpt">A beginner's guide to cloud computing concepts and how to get started with major cloud platforms...</p>
                            </article>
                        </div>
                    </div>
                `

      case "terminal":
        return `
                    <div class="terminal-content">
                        <div class="terminal-output" id="terminalOutput">Welcome to Mrigendra's Terminal v1.0
Type 'help' for available commands.

</div>
                        <div class="terminal-input-line">
                            <span class="terminal-prompt">mrigendra@portfolio:~$</span>
                            <input type="text" class="terminal-input" id="terminalInput" autocomplete="off">
                        </div>
                    </div>
                `

      default:
        return `<div class="app-content"><h2>${appName}</h2><p>App content goes here...</p></div>`
    }
  }

  initializeApp(appName, content) {
    switch (appName) {
      case "projects":
        this.initializeProjects(content)
        break
      case "terminal":
        this.initializeTerminal(content)
        break
      case "contact":
        this.initializeContact(content)
        break
    }
  }

  initializeProjects(content) {
    const filters = content.querySelectorAll(".filter-chip")
    const projects = content.querySelectorAll(".project-card")

    filters.forEach((filter) => {
      filter.addEventListener("click", () => {
        // Update active filter
        filters.forEach((f) => f.classList.remove("active"))
        filter.classList.add("active")

        const category = filter.dataset.filter

        // Filter projects
        projects.forEach((project) => {
          if (category === "all" || project.dataset.category === category) {
            project.style.display = "block"
          } else {
            project.style.display = "none"
          }
        })
      })
    })

    // Project card click handlers
    projects.forEach((project) => {
      project.addEventListener("click", () => {
        this.showNotification("Project", "Opening project details...")
      })
    })
  }

  initializeTerminal(content) {
    const input = content.querySelector("#terminalInput")
    const output = content.querySelector("#terminalOutput")

    const commands = {
      help: () => `Available commands:
  help        - Show this help message
  about       - Display information about me
  projects    - List my projects
  skills      - Show my technical skills
  contact     - Display contact information
  theme       - Switch between dark/light theme
  clear       - Clear the terminal
  open <app>  - Open an application (resume, projects, about, contact, blog)
  whoami      - Display current user
  date        - Show current date and time
  echo <text> - Echo the provided text

`,
      about: () => `Mrigendra - Full Stack Developer & IT Specialist

I'm a passionate developer with expertise in modern web technologies,
mobile development, and system administration. I love creating
innovative solutions and exceptional user experiences.

Interests: IT, Mobile Development, Music Production, AI/ML

`,
      projects: () => `My Projects:
  🌐 E-Commerce Platform    - React, Node.js, MongoDB
  📱 Fitness Tracker App    - React Native, Firebase
  📊 Analytics Dashboard    - Vue.js, D3.js, Python
  🤖 AI Chatbot            - Python, TensorFlow, NLP
  💻 Code Editor           - Electron, JavaScript
  🎵 Music Streaming App   - Angular, Express, PostgreSQL

`,
      skills: () => `Technical Skills:
  Languages:    JavaScript, Python, Java, TypeScript
  Frontend:     React, Vue.js, Angular, HTML5, CSS3
  Backend:      Node.js, Express, Django, Spring Boot
  Databases:    MongoDB, PostgreSQL, MySQL, Redis
  Cloud:        AWS, Docker, Kubernetes
  Tools:        Git, VS Code, Figma, Postman

`,
      contact: () => `Contact Information:
  Email:     mrigendra@example.com
  LinkedIn:  linkedin.com/in/mrigendra
  GitHub:    github.com/mrigendra
  Portfolio: mrigendra.dev

Feel free to reach out for collaborations or opportunities!

`,
      whoami: () => `mrigendra

`,
      date: () => `${new Date().toString()}

`,
      clear: () => {
        output.textContent = "Welcome to Mrigendra's Terminal v1.0\nType 'help' for available commands.\n\n"
        return ""
      },
      theme: (args) => {
        if (args[0] === "dark" || args[0] === "light") {
          this.theme = args[0]
          this.applyTheme()
          return `Theme switched to ${args[0]} mode.

`
        }
        return `Usage: theme [dark|light]
Current theme: ${this.theme}

`
      },
      open: (args) => {
        if (args[0]) {
          const validApps = ["resume", "projects", "about", "contact", "blog", "terminal"]
          if (validApps.includes(args[0])) {
            this.openApp(args[0])
            return `Opening ${args[0]}...

`
          }
          return `Unknown app: ${args[0]}
Valid apps: ${validApps.join(", ")}

`
        }
        return `Usage: open <app>
Available apps: resume, projects, about, contact, blog, terminal

`
      },
      echo: (args) => `${args.join(" ")}

`,
    }

    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const command = input.value.trim()
        const [cmd, ...args] = command.split(" ")

        // Add command to output
        output.textContent += `mrigendra@portfolio:~$ ${command}\n`

        if (commands[cmd]) {
          const result = commands[cmd](args)
          if (result) {
            output.textContent += result
          }
        } else if (command) {
          output.textContent += `Command not found: ${cmd}\nType 'help' for available commands.\n\n`
        }

        input.value = ""
        output.scrollTop = output.scrollHeight
      }
    })

    // Focus terminal input when terminal window is clicked
    content.addEventListener("click", () => input.focus())
    input.focus()
  }

  initializeContact(content) {
    const form = content.querySelector(".contact-form")
    form.addEventListener("submit", (e) => {
      e.preventDefault()
      this.showNotification("Message Sent!", "Thank you for your message. I'll get back to you soon.")
      form.reset()
    })
  }

  makeDraggable(window, handle) {
    console.log("[v0] Making window draggable:", window.id)

    let isDragging = false
    let startX, startY, startLeft, startTop

    const onMouseDown = (e) => {
      // Only start dragging if clicking on the header, not buttons
      if (e.target.closest(".window-control")) {
        console.log("[v0] Clicked on window control, not dragging")
        return
      }

      console.log("[v0] Starting drag")
      isDragging = true
      startX = e.clientX
      startY = e.clientY

      const computedStyle = window.computedStyleMap ? window.computedStyleMap() : getComputedStyle(window)
      startLeft = Number.parseInt(window.style.left) || 0
      startTop = Number.parseInt(window.style.top) || 0

      this.focusWindow(window)

      // Add cursor style
      document.body.style.cursor = "grabbing"
      handle.style.cursor = "grabbing"

      document.addEventListener("mousemove", onMouseMove)
      document.addEventListener("mouseup", onMouseUp)

      e.preventDefault()
      e.stopPropagation()
    }

    const onMouseMove = (e) => {
      if (!isDragging) return

      const deltaX = e.clientX - startX
      const deltaY = e.clientY - startY

      let newLeft = startLeft + deltaX
      let newTop = startTop + deltaY

      // Constrain to viewport
      const maxLeft = window.innerWidth - window.offsetWidth
      const maxTop = window.innerHeight - window.offsetHeight - 60 // Account for taskbar

      newLeft = Math.max(0, Math.min(newLeft, maxLeft))
      newTop = Math.max(0, Math.min(newTop, maxTop))

      window.style.left = `${newLeft}px`
      window.style.top = `${newTop}px`
    }

    const onMouseUp = () => {
      if (!isDragging) return

      console.log("[v0] Ending drag")
      isDragging = false
      document.body.style.cursor = ""
      handle.style.cursor = "grab"

      document.removeEventListener("mousemove", onMouseMove)
      document.removeEventListener("mouseup", onMouseUp)
    }

    handle.addEventListener("mousedown", onMouseDown)
    handle.style.cursor = "grab"
    handle.style.userSelect = "none"
  }

  focusWindow(window) {
    window.style.zIndex = ++this.windowZIndex

    // Update taskbar active state
    document.querySelectorAll(".running-app").forEach((app) => {
      app.classList.remove("active")
    })

    const appName = window.dataset.app
    const taskbarApp = document.querySelector(`[data-taskbar-app="${appName}"]`)
    if (taskbarApp) {
      taskbarApp.classList.add("active")
    }
  }

  closeWindow(appName) {
    const window = this.openWindows.get(appName)
    if (window) {
      window.classList.remove("active")
      setTimeout(() => {
        window.remove()
        this.openWindows.delete(appName)
        this.updateTaskbar()
      }, 300)
    }
  }

  minimizeWindow(appName) {
    const window = this.openWindows.get(appName)
    if (window) {
      window.classList.add("minimized")
      this.updateTaskbar()
    }
  }

  restoreWindow(appName) {
    const window = this.openWindows.get(appName)
    if (window) {
      window.classList.remove("minimized")
      this.focusWindow(window)
      this.updateTaskbar()
    }
  }

  toggleMaximize(appName) {
    const window = this.openWindows.get(appName)
    if (window) {
      if (window.classList.contains("maximized")) {
        window.classList.remove("maximized")
        window.style.width = ""
        window.style.height = ""
        window.style.left = window.dataset.originalLeft || "100px"
        window.style.top = window.dataset.originalTop || "100px"
      } else {
        window.dataset.originalLeft = window.style.left
        window.dataset.originalTop = window.style.top
        window.classList.add("maximized")
        window.style.left = "0px"
        window.style.top = "0px"
        window.style.width = "100vw"
        window.style.height = "calc(100vh - 60px)"
      }
    }
  }

  updateTaskbar() {
    const runningApps = document.getElementById("runningApps")
    runningApps.innerHTML = ""

    this.openWindows.forEach((window, appName) => {
      const app = document.createElement("div")
      app.className = "running-app"
      app.dataset.taskbarApp = appName
      app.textContent = this.getAppTitle(appName)

      if (window.classList.contains("minimized")) {
        app.classList.add("minimized")
      }

      app.addEventListener("click", () => {
        if (window.classList.contains("minimized")) {
          this.restoreWindow(appName)
        } else {
          this.minimizeWindow(appName)
        }
      })

      runningApps.appendChild(app)
    })
  }

  toggleLauncher() {
    const launcher = document.getElementById("launcher")
    launcher.classList.toggle("active")

    if (launcher.classList.contains("active")) {
      document.getElementById("launcherSearch").focus()
    }
  }

  hideLauncher() {
    document.getElementById("launcher").classList.remove("active")
  }

  filterLauncher(query) {
    const apps = document.querySelectorAll(".launcher-app")
    apps.forEach((app) => {
      const appName = app.textContent.toLowerCase()
      if (appName.includes(query.toLowerCase())) {
        app.style.display = "flex"
      } else {
        app.style.display = "none"
      }
    })
  }

  toggleTheme() {
    this.theme = this.theme === "dark" ? "light" : "dark"
    this.applyTheme()
    this.showNotification("Theme Changed", `Switched to ${this.theme} mode`)
  }

  applyTheme() {
    document.body.dataset.theme = this.theme
    localStorage.setItem("theme", this.theme)

    const themeButton = document.getElementById("themeToggle")
    themeButton.textContent = this.theme === "dark" ? "☀️" : "🌙"
  }

  showNotification(title, message) {
    const notification = document.createElement("div")
    notification.className = "notification"
    notification.innerHTML = `
            <div class="notification-header">
                <span class="notification-title">${title}</span>
                <button class="notification-close">×</button>
            </div>
            <div class="notification-message">${message}</div>
        `

    const container = document.getElementById("notificationsContainer")
    container.appendChild(notification)

    // Animate in
    setTimeout(() => notification.classList.add("active"), 100)

    // Auto dismiss
    setTimeout(() => this.dismissNotification(notification), 5000)

    // Close button
    notification.querySelector(".notification-close").addEventListener("click", () => {
      this.dismissNotification(notification)
    })

    // Update notification count
    this.notifications.push(notification)
    this.updateNotificationBadge()
  }

  dismissNotification(notification) {
    notification.classList.remove("active")
    setTimeout(() => {
      notification.remove()
      this.notifications = this.notifications.filter((n) => n !== notification)
      this.updateNotificationBadge()
    }, 300)
  }

  updateNotificationBadge() {
    const badge = document.getElementById("notificationBadge")
    badge.textContent = this.notifications.length
    badge.style.display = this.notifications.length > 0 ? "flex" : "none"
  }

  showNotifications() {
    if (this.notifications.length === 0) {
      this.showNotification("No Notifications", "You're all caught up!")
    }
  }

  handleKeyboard(e) {
    // Escape key closes launcher and focused windows
    if (e.key === "Escape") {
      this.hideLauncher()

      // Close any modals or focused elements
      const activeElement = document.activeElement
      if (activeElement && activeElement.blur) {
        activeElement.blur()
      }
    }

    // Alt + Tab for window switching (simplified)
    if (e.altKey && e.key === "Tab") {
      e.preventDefault()
      // Cycle through open windows
      const windows = Array.from(this.openWindows.values())
      if (windows.length > 1) {
        const currentZ = Math.max(...windows.map((w) => Number.parseInt(w.style.zIndex)))
        const currentWindow = windows.find((w) => Number.parseInt(w.style.zIndex) === currentZ)
        const currentIndex = windows.indexOf(currentWindow)
        const nextIndex = (currentIndex + 1) % windows.length
        this.focusWindow(windows[nextIndex])
      }
    }
  }

  setupParticles() {
    const canvas = document.getElementById("particleCanvas")
    const ctx = canvas.getContext("2d")

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    const particles = []
    const particleCount = 50

    // Create particles
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 2 + 1,
        opacity: Math.random() * 0.5 + 0.2,
      })
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      particles.forEach((particle) => {
        // Update position
        particle.x += particle.vx
        particle.y += particle.vy

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.width
        if (particle.x > canvas.width) particle.x = 0
        if (particle.y < 0) particle.y = canvas.height
        if (particle.y > canvas.height) particle.y = 0

        // Draw particle
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle =
          this.theme === "dark" ? `rgba(0, 255, 255, ${particle.opacity})` : `rgba(139, 92, 246, ${particle.opacity})`
        ctx.fill()
      })

      // Draw connections
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 100) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.strokeStyle =
              this.theme === "dark"
                ? `rgba(0, 255, 255, ${0.1 * (1 - distance / 100)})`
                : `rgba(139, 92, 246, ${0.1 * (1 - distance / 100)})`
            ctx.stroke()
          }
        })
      })

      requestAnimationFrame(animate)
    }

    animate()
  }

  updateTime() {
    const now = new Date()
    const timeString = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    const dateString = now.toLocaleDateString([], {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })

    // Update lock screen
    const lockTime = document.getElementById("lockTime")
    const lockDate = document.getElementById("lockDate")
    if (lockTime) lockTime.textContent = timeString
    if (lockDate) lockDate.textContent = dateString

    // Update taskbar
    const systemTime = document.getElementById("systemTime")
    if (systemTime) systemTime.textContent = timeString
  }
}

// Initialize the Digital OS when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new DigitalOS()
})
