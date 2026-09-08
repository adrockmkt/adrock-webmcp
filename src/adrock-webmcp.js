(async function () {
  if (!("modelContext" in document)) {
    console.info("[Ad Rock WebMCP] WebMCP não disponível neste navegador.");
    return;
  }

  try {
    await document.modelContext.registerTool({
      name: "get_company_information",
      title: "Get Ad Rock company information",
      description:
        "Returns public information about Ad Rock Digital Mkt, a Brazilian digital marketing and technology consultancy.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true
      },
      execute: async () => {
        return JSON.stringify({
          company: {
            name: "Ad Rock Digital Mkt",
            website: "https://adrock.com.br/",
            about_url: "https://adrock.com.br/sobre-nos",
            location: {
              city: "Curitiba",
              state: "Paraná",
              country: "Brazil"
            }
          },
          business: {
            type: "Digital marketing and technology consultancy",
            areas: [
              "SEO",
              "Paid Media",
              "Google Ads",
              "Meta Ads",
              "LinkedIn Ads",
              "Web Analytics",
              "Digital Strategy",
              "UX/UI",
              "Website Development",
              "Systems Development",
              "Application Development",
              "Automation",
              "Artificial Intelligence"
            ]
          }
        });
      }
    });

    console.info("[Ad Rock WebMCP] Tool registrada: get_company_information");

    await document.modelContext.registerTool({
      name: "get_services",
      title: "Get Ad Rock services",
      description:
        "Returns the main digital marketing, analytics, development, automation and artificial intelligence services offered by Ad Rock Digital Mkt.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true
      },
      execute: async () => {
        return JSON.stringify({
          company: "Ad Rock Digital Mkt",
          services: [
            {
              name: "SEO",
              category: "Digital Marketing",
              description:
                "Technical and strategic search engine optimization focused on organic visibility, search performance, content architecture and technical SEO.",
              url: "https://adrock.com.br/"
            },
            {
              name: "Google Ads",
              category: "Paid Media",
              description:
                "Planning, setup, management and optimization of Google Ads campaigns focused on measurable business results.",
              url: "https://adrock.com.br/"
            },
            {
              name: "Meta Ads",
              category: "Paid Media",
              description:
                "Planning, management and optimization of advertising campaigns across Meta platforms, including Facebook and Instagram.",
              url: "https://adrock.com.br/"
            },
            {
              name: "LinkedIn Ads",
              category: "Paid Media",
              description:
                "Paid media planning and campaign management for LinkedIn, including B2B and professional audience strategies.",
              url: "https://adrock.com.br/"
            },
            {
              name: "Web Analytics",
              category: "Analytics",
              description:
                "Analytics implementation, measurement architecture and data analysis using platforms such as Google Analytics 4 and Google Tag Manager.",
              url: "https://adrock.com.br/"
            },
            {
              name: "Digital Strategy",
              category: "Strategy",
              description:
                "Digital strategy, media planning, campaign activation, content planning and performance-oriented consulting.",
              url: "https://adrock.com.br/"
            },
            {
              name: "UX/UI",
              category: "Design and Conversion",
              description:
                "User experience and interface design focused on usability, engagement and conversion.",
              url: "https://adrock.com.br/"
            },
            {
              name: "Website Development",
              category: "Development",
              description:
                "Development of institutional websites, landing pages, campaign websites and other web experiences using technologies and platforms such as WordPress and modern web frameworks.",
              url: "https://adrock.com.br/codigo"
            },
            {
              name: "Systems Development",
              category: "Development",
              description:
                "Development of custom web systems, integrations, APIs, dashboards and digital tools using technologies such as Python, React and Next.js.",
              url: "https://adrock.com.br/codigo"
            },
            {
              name: "Application Development",
              category: "Development",
              description:
                "Development of mobile applications and digital products for Android, iOS and cross-platform environments.",
              url: "https://adrock.com.br/codigo"
            },
            {
              name: "Automation",
              category: "Automation",
              description:
                "Development of marketing, operational and data automation workflows, integrations and internal tools.",
              url: "https://adrock.com.br/codigo"
            },
            {
              name: "Artificial Intelligence",
              category: "Artificial Intelligence",
              description:
                "Artificial intelligence solutions, AI-assisted workflows, intelligent automation, internal tools and integrations with language models.",
              url: "https://adrock.com.br/codigo"
            },
            {
              name: "Digital Marketing for NGOs",
              category: "Nonprofit",
              description:
                "Digital marketing, Google Ad Grants, paid media, analytics, UX/UI and automation services designed for nonprofit organizations.",
              url: "https://adrock.com.br/ongs"
            }
          ]
        });
      }
    });

    console.info("[Ad Rock WebMCP] Tool registrada: get_services");

    await document.modelContext.registerTool({
      name: "get_contact_information",
      title: "Get Ad Rock contact information",
      description:
        "Returns official public contact channels for Ad Rock Digital Mkt, including email, phone, WhatsApp, contact page and meeting scheduling.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false
      },
      annotations: {
        readOnlyHint: true
      },
      execute: async () => {
        return JSON.stringify({
          company: "Ad Rock Digital Mkt",
          contact: {
            website: "https://adrock.com.br/",
            contact_page: "https://adrock.com.br/contato",
            commercial_email: {
              address: "contato@adrock.com.br",
              purpose: "Commercial inquiries, proposals and general contact"
            },
            phone: {
              number: "+55 41 99125-5859",
              formatted: "+55 (41) 99125-5859",
              type: "Commercial"
            },
            whatsapp: {
              number: "+55 41 99125-5859",
              formatted: "+55 (41) 99125-5859",
              available: true,
              url: "https://wa.me/5541991255859"
            },
            meeting: {
              available: true,
              provider: "Calendly",
              url: "https://calendly.com/adrockmkt"
            },
            privacy_contact: {
              email: "privacidade@adrock.com.br",
              purpose: "Privacy, data protection and website administration inquiries"
            }
          },
          preferred_commercial_channels: [
            "Email",
            "WhatsApp",
            "Contact Form",
            "Scheduled Meeting"
          ]
        });
      }
    });

    console.info("[Ad Rock WebMCP] Tool registrada: get_contact_information");
  } catch (error) {
    console.error("[Ad Rock WebMCP] Erro ao registrar tools:", error);
  }
})();
