import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

import { DEMO_USER_ID } from "../lib/constants";
import { resumeContentSchema, type ResumeContent } from "../lib/schemas/resume";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// Transcribed from Downloads/Maurycy Dziedzic_CV_.pdf and the Kamil Dubicki CV.
// Both are run through resumeContentSchema before writing so the seed can only
// ever produce a payload the app itself considers valid.

const kamil: ResumeContent = resumeContentSchema.parse({
  template: "classic",
  contact: {
    fullName: "Kamil Dubicki",
    headline: "IT Engineer",
    phone: "+48 603 559 787",
    email: "dubicki.kamil@outlook.com",
    linkedin: "linkedin.com/in/kamil-dubicki",
  },
  summary:
    "Results-driven IT Engineer with a background in network infrastructure and systems administration. Passionate about DevOps methodologies, with practical hands-on experience in automating workflows (Python, Bash), configuration management (Ansible), and developing resilient API data pipelines. Eager to leverage a deep understanding of TCP/IP and system architecture to build, maintain, and scale robust cloud environments.",
  experience: [
    {
      company: "Allegro",
      role: "Systems Administrator",
      startDate: "04.2026",
      current: true,
      highlights: [
        "Architected and deployed custom Python-based automation tools (DAGs) to extract and process data from external APIs (Jira, Slack), implementing exponential backoff strategies to effectively bypass rate limiting.",
        "Initiated the containerization of internal administrative scripts using Docker, improving deployment consistency, environment isolation, and laying the groundwork for CI/CD pipelines.",
        "Streamlined system administration workflows by introducing modern engineering practices, transitioning from manual operational tasks to automated, resilient data pipelines.",
      ],
    },
    {
      company: "Allegro",
      role: "Junior Systems Administrator",
      startDate: "08.2024",
      endDate: "04.2026",
      highlights: [
        "Automated routine maintenance tasks and operational processes using Bash and Python scripting, significantly reducing manual workload and minimizing human error.",
        "Managed and configured enterprise-level systems (including Genesys Cloud), ensuring high availability and resolving complex configuration bottlenecks for internal stakeholders.",
        "Acted as a technical bridge between business requirements and system capabilities, optimizing internal workflows and maintaining system integrity in a large-scale e-commerce environment.",
      ],
    },
    {
      company: "Nokia Solutions and Networks",
      role: "Network Engineer",
      startDate: "10.2023",
      endDate: "07.2024",
      highlights: [
        "Managed and optimized telecommunications network infrastructure, ensuring robust connectivity and system performance based on a deep understanding of the TCP/IP stack.",
        "Automated network diagnostic tasks and configuration workflows using Python and Bash scripting, reducing mean time to resolution (MTTR) for connectivity issues.",
        "Collaborated with cross-functional teams to monitor network health and implement configuration changes, utilizing standard IT diagnostic tools to maintain high availability and performance.",
      ],
    },
    {
      company: "Nokia Solutions and Networks",
      role: "IP Engineer - Summer Trainee",
      startDate: "07.2023",
      endDate: "09.2023",
      highlights: [
        "Assisted in configuring, testing, and troubleshooting IP networks, gaining hands-on experience with core routing and switching protocols.",
        "Supported senior engineers in deploying network topologies and conducting performance tests in both simulated (GNS3) and live environments.",
      ],
    },
  ],
  education: [
    {
      institution: "Poznan University of Technology",
      degree: "Bachelor of Science (B.Sc.) in Information and Communication Technology",
      startDate: "2020",
      endDate: "2024",
      description:
        "BSc Thesis: Automation Management of Virtualized Systems using Ansible. Project focus: Infrastructure as Code (IaC), automated system deployment, and dynamic network configuration. Tech stack: Ansible, AWX, Ubuntu, Nagios, GNS3, VMware, VirtualBox.",
    },
  ],
  projects: [
    {
      name: "Automation management of virtualised systems using Ansible",
      description:
        "Engineering thesis demonstrating Ansible's capabilities in automating and managing IT infrastructure within dynamic and evolving environments. It showcases virtualization, configuration management, and Infrastructure as Code (IaC) to enhance efficiency and scalability.",
      highlights: [
        "Utilized VirtualBox, VMware Workstation, and GNS3 to create a scalable, reproducible environment.",
        "Configured and managed Ubuntu-based systems using Ansible playbooks to streamline deployments.",
        "Automated network infrastructure setup, including dynamic configuration changes to OSPF protocol from RIPv2 using Ansible for improved network adaptability and system provisioning.",
        "Designed repeatable, scalable automation workflows, ensuring consistency and reliability.",
        "Automated Nagios and AWX deployment using Ansible.",
      ],
    },
    {
      name: "Phishing",
      description:
        "A project demonstrating the use of automation and behavioral analytics in assessing email security vulnerabilities. It showcases Python scripting, web scraping, and data-driven tracking to execute a targeted phishing awareness campaign, evaluating cybersecurity resilience in real-world scenarios.",
      highlights: [
        "Developed a Python web scraper to extract and categorize email addresses with relevant metadata (title, gender, and affiliation).",
        "Designed customized email templates tailored to specific target groups, increasing engagement and realism.",
        "Integrated Google Analytics to monitor email open rates, link clicks, and user interactions, providing real-time insights.",
        "Evaluated human responses to phishing attempts, identifying weaknesses in email security practices.",
        "Showcased how automation and data analysis can enhance cybersecurity defenses and awareness training.",
      ],
    },
  ],
  skillGroups: [
    { category: "Programming", skills: ["Python", "Bash", "YAML", "TypeScript", "JavaScript"] },
    { category: "Tools", skills: ["Linux", "Apache", "Nginx", "Ansible", "Postman", "Virtualization"] },
    { category: "Databases", skills: ["BigQuery", "PostgreSQL"] },
    { category: "Networking", skills: ["TCP/IP", "Routing & Switching", "IP addressing", "Subnetting"] },
  ],
  languages: [
    { name: "English", proficiency: "Fluent" },
    { name: "Polish", proficiency: "Native" },
  ],
  certifications: [
    { name: "Ewolucja Developera - wKontenerach" },
    { name: "Devops Engineer - StrefaKursów" },
    { name: "ITIL 4 Foundation" },
    { name: "Nokia IP Networks and Services Fundamentals" },
  ],
});

const maurycy: ResumeContent = resumeContentSchema.parse({
  template: "sidebar",
  contact: {
    fullName: "Maurycy Dziedzic",
    headline: "Security Solutions Engineer",
    phone: "+48 723793034",
    email: "dziedzic.maurycy00@gmail.com",
    linkedin: "https://www.linkedin.com/in/maurycy-dziedzic-551326268/",
  },
  summary:
    "I am an IT specialist with solid experience in networking and cybersecurity, gained through work with major IT companies and a large rail vehicle manufacturer. I hold certifications from Huawei ICT Academy, Cisco (CCNA), and Nokia Routing Specialist, and have completed advanced cybersecurity training at Sekurak Academy and in Suricata IDS/IPS systems. I actively participate in industry events such as INSECON 2024 and ITSEC Mega Sekurak Hacking Party, and have contributed to projects on IoT cybersecurity, including international cooperation within the EUNICE project with the University of Mons, as well as projects on digital signatures and secure satellite communication. Skilled in network design, AAA systems, and automation, I am driven by continuous improvement and a commitment to engineering excellence.",
  experience: [
    {
      company: "Stadler",
      role: "Security and Network Engineer",
      startDate: "May 2025",
      current: true,
      highlights: [
        "OT Network Design from Scratch: Designed and implemented OT networks for rolling stock in line with security standards.",
        "Component Selection: Selected and integrated network devices (switches, routers, firewalls) tailored to infrastructure needs.",
        "Topology & Implementation: Built network topologies from scratch and implemented them as physical network structures.",
        "Configuration Deployment: Prepared, uploaded, and validated device configurations.",
        "Technical Documentation: Created clear, concise, and structured documentation to support system design and implementation.",
      ],
    },
    {
      company: "Eviden",
      role: "Security Engineer",
      startDate: "June 2024",
      endDate: "May 2025",
      highlights: [
        "RSA token management: implemented, configured, and administered RSA tokens for secure two-factor authentication.",
        "RSA server upgrade: upgraded the RSA server to a newer version to improve security and stability.",
        "Participated in the planning and execution of the Cisco ISE upgrade.",
        "RADIUS server maintenance: administered and managed RADIUS servers, diagnosing and resolving issues to ensure continuity of authentication services.",
        "Contributed to RADIUS server migration, configuring and implementing security solutions to improve performance and resilience.",
        "Certificate renewal: managed the lifecycle of digital certificates, including renewal and deployment.",
        "Conducted DR tests on RADIUS servers to verify backup and restore processes.",
        "Created automation and reporting scripts in Python and Bash.",
      ],
    },
    {
      company: "Nokia Solutions and Networks",
      role: "Network Engineer",
      startDate: "September 2022",
      endDate: "June 2024",
      highlights: [
        "Conducting software updates: planned and carried out software updates for network devices to improve performance and security with minimal downtime.",
        "Managing service migrations: performed migrations of critical network services.",
        "Creating automation scripts in Python to automate network configurations, increasing efficiency and reducing manual errors.",
        "Post-update cleanup to ensure optimal performance.",
        "Technical documentation creation describing updates, migrations, and automation for future reference.",
      ],
    },
    {
      company: "Nokia Solutions and Networks",
      role: "Summer Trainee - Optics",
      startDate: "June 2022",
      endDate: "September 2022",
      highlights: [
        "Learned about data transmission in fiber optics, including DWDM, UDWDM, and EDFA.",
        "Managed post-software update cleanup to optimize performance and improve security.",
      ],
    },
  ],
  education: [
    {
      institution: "Poznań University of Technology",
      degree: "Master's degree",
      fieldOfStudy: "ICT networks and cloud solutions",
      startDate: "2024",
      endDate: "09.2025",
    },
    {
      institution: "Politechnika Poznańska",
      degree: "Bachelor of Engineering",
      fieldOfStudy: "ICT",
      startDate: "2020",
      endDate: "2024",
    },
    {
      institution: "Electronics Technical School in Bydgoszcz",
      degree: "Technician",
      fieldOfStudy: "ICT",
      startDate: "2016",
      endDate: "2020",
    },
  ],
  skillGroups: [
    {
      category: "Cybersecurity",
      skills: [
        "Configuration and maintenance of network firewalls (including IDS/IPS – Suricata, Snort 2/3), implementation of security policies and AAA (RADIUS).",
      ],
    },
    {
      category: "Networking & Infrastructure Security",
      skills: [
        "Strong understanding of network topology, TCP/IP, and OSI models; LAN, WAN, and VLAN configuration; routing protocols (OSPF, BGP, RIP, MPLS); NAT, PAT, and VPN technologies; devices from Cisco, Nokia, Huawei, and Westermo.",
      ],
    },
    {
      category: "Operating Systems & Platforms",
      skills: [
        "Administration of Linux/Unix systems (RedHat, CentOS, Debian, Ubuntu); management and security configuration of Windows Server environments.",
      ],
    },
    {
      category: "Cloud & Automation",
      skills: [
        "Basic knowledge of Azure and its security components; scripting and automation using Python and Bash for monitoring and system configuration.",
      ],
    },
    {
      category: "Processes & Methodologies",
      skills: [
        "Working knowledge of ITIL processes (Incident, Change, Problem Management); Agile-based technical and project environments; clear and concise technical documentation.",
      ],
    },
    {
      category: "Analytical & Problem-Solving",
      skills: [
        "Strong analytical and troubleshooting skills for security incidents and network anomalies.",
      ],
    },
    {
      category: "Communication & Collaboration",
      skills: [
        "Proficient in English for global collaboration; strong teamwork and experience with cross-functional, international teams.",
      ],
    },
  ],
  certifications: [
    { name: "FCF Fortinet Certified Fundamentals in Cybersecurity" },
    { name: "FCA Fortinet Certified Associate in Cybersecurity" },
    { name: "ACERT SERMO academic certificate in English at level B2" },
  ],
  interests:
    "I am passionate about fitness and healthy living. I regularly train powerlifting at the gym, which improves my strength and understanding of the mechanics of the human body, so that no challenge is too heavy for me to lift. I also enjoy hiking in the mountains, appreciating nature while staying active.",
});

const SEEDS: { id: string; title: string; content: ResumeContent }[] = [
  { id: "example-classic-kamil", title: "Kamil Dubicki — IT Engineer", content: kamil },
  { id: "example-sidebar-maurycy", title: "Maurycy Dziedzic — Security Engineer", content: maurycy },
];

async function main() {
  for (const seed of SEEDS) {
    // Deterministic ids + upsert make re-seeding idempotent: running this twice
    // refreshes the two examples rather than piling up duplicates.
    await prisma.resume.upsert({
      where: { id: seed.id },
      create: { id: seed.id, userId: DEMO_USER_ID, title: seed.title, content: seed.content },
      update: { title: seed.title, content: seed.content },
    });
    console.log(`Seeded ${seed.id}`);
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
