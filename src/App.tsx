import React, { useState, useEffect } from "react";
import { TitleBar } from "./components/TitleBar";
import { Sidebar, NavMenuKey } from "./components/Sidebar";
import { ProjectList, PROJECT_STATUS_OPTIONS } from "./components/ProjectList";
import { RabProjectList } from "./components/RabProjectList";
import { ScheduleProjectList } from "./components/ScheduleProjectList";
import { CreateRabProject } from "./components/CreateRabProject";
import { ScheduleTracker } from "./components/ScheduleTracker";
import { MasterDatabase } from "./components/MasterDatabase";
import { VendorList } from "./components/VendorList";
import { CategoryManagement } from "./components/CategoryManagement";
import { SourceCodeViewer } from "./components/SourceCodeViewer";
import { InteriorRabDraft } from "./components/InteriorRabDraft";
import { InteriorProjectList } from "./components/InteriorProjectList";
import { InteriorRabList } from "./components/InteriorRabList";
import { InteriorDatabaseSpecification } from "./components/InteriorDatabaseSpecification";
import {
  INITIAL_MASTER_DATABASE,
  INITIAL_PROJECTS,
  INITIAL_VENDORS,
  INITIAL_CATEGORIES,
  INITIAL_INTERIOR_PROJECTS,
  INITIAL_INTERIOR_SPEC_DB,
} from "./data/initialData";
import { MasterCostItem, Project, ProjectStatus, RabRevision, Vendor, InteriorProject, InteriorSpecification, InteriorRABRevision } from "./types";
import { ArrowLeft, Calculator, CalendarDays, Building2, MapPin, Sparkles } from "lucide-react";

export default function App() {
  const [activeMenu, setActiveMenu] = useState<NavMenuKey>("project-list");
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  // Active Project being edited in RAB Draft or Schedule Draft
  const [editingProject, setEditingProject] = useState<Project | null>(INITIAL_PROJECTS[0]);

  // ISOLATED INTERIOR MASTER STATE WITH LOCAL STORAGE PERSISTENCE
  const INTERIOR_STORAGE_KEY = "rakitco_interior_projects_db_v1";
  const [interiorProjects, setInteriorProjects] = useState<InteriorProject[]>(() => {
    try {
      const saved = localStorage.getItem(INTERIOR_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error("Failed to load interior projects from storage", e);
    }
    return INITIAL_INTERIOR_PROJECTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(INTERIOR_STORAGE_KEY, JSON.stringify(interiorProjects));
    } catch (e) {
      console.error("Failed to save interior projects to storage", e);
    }
  }, [interiorProjects]);

  const [interiorSpecDB, setInteriorSpecDB] = useState<InteriorSpecification[]>(INITIAL_INTERIOR_SPEC_DB);
  const [editingInteriorProject, setEditingInteriorProject] = useState<InteriorProject | null>(null);
  const [editingInteriorRevisionId, setEditingInteriorRevisionId] = useState<string | undefined>(undefined);

  // Application master datasets
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES);
  const [masterItems, setMasterItems] = useState<MasterCostItem[]>(
    INITIAL_MASTER_DATABASE
  );
  const [projects, setProjects] = useState<Project[]>(INITIAL_PROJECTS);
  const [vendors, setVendors] = useState<Vendor[]>(INITIAL_VENDORS);

  // DECOUPLED INTERIOR HANDLERS
  const handleCreateInteriorProject = () => {
    const newPrj: InteriorProject = {
      id: `iprj-${Date.now()}`,
      projectCode: `IPRJ-2026-${String(interiorProjects.length + 1).padStart(3, "0")}`,
      name: "New Interior Project",
      ownerName: "Client",
      location: "Location",
      status: "On Tender",
      createdAt: new Date().toISOString().split("T")[0],
      requirements: {
        landArea: 200,
        buildingArea: 150,
        floorsCount: 2,
        ceilingHeight: 3.2,
        designStyle: 'Modern Minimalist',
        finishingGrade: 'Deluxe (Medium)',
        scopeOfWork: ['Interior Fit-Out']
      },
      revisions: [
        {
          id: `rev-${Date.now()}`,
          name: "Initial Draft",
          date: new Date().toISOString().split("T")[0],
          version: 1,
          isDraft: true,
          usePpn: false,
          sections: [],
          grandTotal: 0
        }
      ]
    };
    setInteriorProjects([newPrj, ...interiorProjects]);
    setEditingInteriorProject(newPrj);
    setEditingInteriorRevisionId(undefined);
    setActiveMenu("interior-rab-draft");
  };

  const handleOpenInteriorRabDraft = (project: InteriorProject, revision?: InteriorRABRevision | string) => {
    const freshest = interiorProjects.find(p => p.id === project.id) || project;
    setEditingInteriorProject(freshest);
    const revId = typeof revision === "string" ? revision : revision?.id;
    setEditingInteriorRevisionId(revId);
    setActiveMenu("interior-rab-draft");
  };

  const handleSaveInteriorProject = (updated: InteriorProject) => {
    setInteriorProjects(prev => prev.map(p => p.id === updated.id ? updated : p));
    setEditingInteriorProject(updated);
  };

  const handleUpdateInteriorProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setInteriorProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );
    setEditingInteriorProject((prev) =>
      prev && prev.id === projectId ? { ...prev, status: newStatus } : prev
    );
  };

  const handleUpdateInteriorProject = (updated: InteriorProject) => {
    setInteriorProjects((prev) =>
      prev.map((p) => (p.id === updated.id ? updated : p))
    );
    setEditingInteriorProject((prev) =>
      prev && prev.id === updated.id ? updated : prev
    );
  };


  // Handlers for Category Management
  const handleAddCategory = (category: string) => {
    setCategories((prev) => [...prev, category]);
  };

  const handleUpdateCategory = (oldCategory: string, newCategory: string) => {
    setCategories((prev) => prev.map((c) => (c === oldCategory ? newCategory : c)));
    // Cascade update to master items and vendors
    setMasterItems((prev) =>
      prev.map((item) => (item.category === oldCategory ? { ...item, category: newCategory } : item))
    );
    setVendors((prev) =>
      prev.map((vendor) => (vendor.category === oldCategory ? { ...vendor, category: newCategory } : vendor))
    );
  };

  const handleDeleteCategory = (category: string) => {
    setCategories((prev) => prev.filter((c) => c !== category));
  };

  // Code & Architecture Viewer modal
  const [isCodeViewerOpen, setIsCodeViewerOpen] = useState(false);

  // Handlers for Master Database CRUD
  const handleAddMasterItem = (newItem: MasterCostItem) => {
    setMasterItems((prev) => [newItem, ...prev]);
  };

  const handleUpdateMasterItem = (updatedItem: MasterCostItem) => {
    setMasterItems((prev) =>
      prev.map((m) => (m.id === updatedItem.id ? updatedItem : m))
    );
  };

  const handleDeleteMasterItem = (id: string) => {
    setMasterItems((prev) => prev.filter((m) => m.id !== id));
  };

  // Real-time status update for Project List
  const handleUpdateProjectStatus = (projectId: string, newStatus: ProjectStatus) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === projectId ? { ...p, status: newStatus } : p))
    );
    if (editingProject && editingProject.id === projectId) {
      setEditingProject((prev) => (prev ? { ...prev, status: newStatus } : null));
    }
  };

  const handleUpdateProject = (updatedProject: Project) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
    if (editingProject && editingProject.id === updatedProject.id) {
      setEditingProject(updatedProject);
    }
  };

  // Handlers for Project Creation and Workspace Opening
  const handleOpenRabDraft = (project: Project, revision?: RabRevision) => {
    if (revision) {
      setEditingProject({
        ...project,
        activeRevisionNumber: revision.revisionNumber,
        grandTotal: revision.grandTotal,
        subtotal: revision.subtotal,
        items: revision.items && revision.items.length > 0 ? revision.items : project.items,
      });
    } else {
      const activeRev = project.revisions?.find((r) => r.isLatest) || project.revisions?.[0];
      setEditingProject({
        ...project,
        activeRevisionNumber: activeRev?.revisionNumber || project.activeRevisionNumber || "Rev.01",
        grandTotal: activeRev?.grandTotal ?? project.grandTotal,
        subtotal: activeRev?.subtotal ?? project.subtotal,
        items: activeRev?.items && activeRev.items.length > 0 ? activeRev.items : project.items,
      });
    }
    setActiveMenu("rab-draft");
  };

  const handleOpenScheduleDraft = (project: Project) => {
    setEditingProject(project);
    setActiveMenu("schedule-draft");
  };

  const handleCreateNewProject = (projectData: Partial<Project>) => {
    const newProjectId = `prj-${Date.now()}`;
    const initialStatus: ProjectStatus =
      (projectData.status as ProjectStatus) || "On Tender";

    const initialRevision: RabRevision = {
      id: `rev-${newProjectId}-01`,
      projectId: newProjectId,
      revisionNumber: "Rev.01",
      title: "Initial Tender Draft (Latest)",
      createdAt: new Date().toISOString().split("T")[0],
      isLatest: true,
      itemCount: 0,
      subtotal: 0,
      grandTotal: 0,
      notes: "Draft awal tender pengajuan BoQ",
    };

    const newProject: Project = {
      id: newProjectId,
      projectCode:
        projectData.projectCode ||
        `PRJ-2026-${String(projects.length + 1).padStart(3, "0")}`,
      name: projectData.name || "Proyek Baru",
      ownerName: projectData.ownerName || "Klien",
      location: projectData.location || "Indonesia",
      description: projectData.description || "",
      status: initialStatus,
      createdAt: new Date().toISOString().split("T")[0],
      requirements: projectData.requirements || {
        landArea: 0,
        buildingArea: 120,
        floorsCount: 1,
        ceilingHeight: 3.2,
        designStyle: "Modern Minimalist",
        finishingGrade: "Standard (Ekonomis)",
        scopeOfWork: ["Struktur", "Arsitektur"],
        estimatedDurationWeeks: 12,
      },
      activeRevisionNumber: "Rev.01",
      revisions: [initialRevision],
      items: [],
      contingencyPercent: 5,
      overheadProfitPercent: 10,
      taxPercent: 11,
      subtotal: 0,
      grandTotal: 0,
    };

    setProjects((prev) => [newProject, ...prev]);
    setEditingProject(newProject);
    setActiveMenu("rab-draft");
  };

  // Revision tree management
  const handleCreateRevision = (projectId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentRevs = p.revisions || [];
        let maxNum = 0;
        currentRevs.forEach((r) => {
          const match = r.revisionNumber.match(/Rev\.(\d+)/i);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        if (maxNum === 0) maxNum = currentRevs.length || 1;
        const nextNum = maxNum + 1;
        const nextRevNum = `Rev.${String(nextNum).padStart(2, "0")}`;

        const newRev: RabRevision = {
          id: `rev-${p.id}-${Date.now()}`,
          projectId: p.id,
          revisionNumber: nextRevNum,
          title: `Revisi Baru (${nextRevNum})`,
          createdAt: new Date().toISOString().split("T")[0],
          isLatest: true,
          itemCount: p.items?.length || 0,
          subtotal: p.subtotal || 0,
          grandTotal: p.grandTotal || 0,
          items: [...(p.items || [])],
          notes: `Dibuat dari draft aktif proyek`,
        };
        const updatedRevs = currentRevs.map((r) => ({ ...r, isLatest: false }));
        return {
          ...p,
          revisions: [...updatedRevs, newRev],
          activeRevisionNumber: nextRevNum,
        };
      })
    );
  };

  const handleDuplicateRevision = (projectId: string, revisionId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentRevs = p.revisions || [];
        const sourceRev =
          currentRevs.find((r) => r.id === revisionId) || currentRevs[0];

        let maxNum = 0;
        currentRevs.forEach((r) => {
          const match = r.revisionNumber.match(/Rev\.(\d+)/i);
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxNum) maxNum = n;
          }
        });
        if (maxNum === 0) maxNum = currentRevs.length || 1;
        const nextNum = maxNum + 1;
        const nextRevNum = `Rev.${String(nextNum).padStart(2, "0")}`;

        const newRev: RabRevision = {
          id: `rev-${p.id}-${Date.now()}`,
          projectId: p.id,
          revisionNumber: nextRevNum,
          title: `Duplikasi dari ${sourceRev.revisionNumber} - ${sourceRev.title}`,
          createdAt: new Date().toISOString().split("T")[0],
          isLatest: true,
          itemCount: sourceRev.itemCount,
          subtotal: sourceRev.subtotal,
          grandTotal: sourceRev.grandTotal,
          items: sourceRev.items ? [...sourceRev.items] : [...(p.items || [])],
          notes: `Hasil duplikasi dari revisi ${sourceRev.revisionNumber}`,
        };
        const updatedRevs = currentRevs.map((r) => ({ ...r, isLatest: false }));
        return {
          ...p,
          revisions: [...updatedRevs, newRev],
          activeRevisionNumber: nextRevNum,
        };
      })
    );
  };

  // Dedicated "Save As" handler: generates a new sequential revision record
  const handleSaveAsRevision = (
    project: Project,
    revisionTitle: string,
    revisionNotes: string
  ) => {
    const currentRevs = project.revisions || [];
    let maxNum = 0;
    currentRevs.forEach((r) => {
      const match = r.revisionNumber.match(/Rev\.(\d+)/i);
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    if (maxNum === 0) maxNum = currentRevs.length || 1;
    const nextNum = maxNum + 1;
    const nextRevNum = `Rev.${String(nextNum).padStart(2, "0")}`;

    const newRevision: RabRevision = {
      id: `rev-${project.id}-${Date.now()}`,
      projectId: project.id,
      revisionNumber: nextRevNum,
      title: revisionTitle.trim() || `Revisi ${nextRevNum}`,
      createdAt: new Date().toISOString().split("T")[0],
      isLatest: true,
      itemCount: project.items?.length || 0,
      subtotal: project.subtotal || 0,
      grandTotal: project.grandTotal || 0,
      items: [...(project.items || [])],
      notes: revisionNotes.trim() || `Disimpan sebagai revisi baru ${nextRevNum}`,
    };

    // Mark previous revisions as not latest
    const updatedRevs = currentRevs.map((r) => ({ ...r, isLatest: false }));

    const updatedProject: Project = {
      ...project,
      revisions: [...updatedRevs, newRevision],
      activeRevisionNumber: nextRevNum,
    };

    setProjects((prev) =>
      prev.map((p) => (p.id === project.id ? updatedProject : p))
    );
    setEditingProject(updatedProject);
  };

  // Dedicated "Delete Draft" handler: removes specific revision record from SQLite
  const handleDeleteRevision = (projectId: string, revisionId: string) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id !== projectId) return p;
        const currentRevs = p.revisions || [];
        const remaining = currentRevs.filter((r) => r.id !== revisionId);

        if (remaining.length === 0) {
          const fallbackRev: RabRevision = {
            id: `rev-${p.id}-${Date.now()}`,
            projectId: p.id,
            revisionNumber: "Rev.01",
            title: "Initial Draft (Rev.01)",
            createdAt: new Date().toISOString().split("T")[0],
            isLatest: true,
            itemCount: 0,
            subtotal: 0,
            grandTotal: 0,
            items: [],
            notes: "Draft awal setelah reset penghapusan revisi",
          };
          return {
            ...p,
            revisions: [fallbackRev],
            activeRevisionNumber: "Rev.01",
            items: [],
            subtotal: 0,
            grandTotal: 0,
          };
        }

        const hasLatest = remaining.some((r) => r.isLatest);
        if (!hasLatest) {
          remaining[remaining.length - 1].isLatest = true;
        }

        const activeRev = remaining.find((r) => r.isLatest) || remaining[0];

        return {
          ...p,
          revisions: remaining,
          activeRevisionNumber: activeRev.revisionNumber,
          grandTotal: activeRev.grandTotal,
          subtotal: activeRev.subtotal,
          items: activeRev.items && activeRev.items.length > 0 ? activeRev.items : p.items,
        };
      })
    );

    setEditingProject((prev) => {
      if (!prev || prev.id !== projectId) return prev;
      const currentRevs = prev.revisions || [];
      const remaining = currentRevs.filter((r) => r.id !== revisionId);
      if (remaining.length === 0) {
        return {
          ...prev,
          revisions: [],
          activeRevisionNumber: "Rev.01",
          items: [],
          subtotal: 0,
          grandTotal: 0,
        };
      }
      const hasLatest = remaining.some((r) => r.isLatest);
      if (!hasLatest) {
        remaining[remaining.length - 1].isLatest = true;
      }
      const activeRev = remaining.find((r) => r.isLatest) || remaining[0];
      return {
        ...prev,
        revisions: remaining,
        activeRevisionNumber: activeRev.revisionNumber,
        grandTotal: activeRev.grandTotal,
        subtotal: activeRev.subtotal,
        items: activeRev.items && activeRev.items.length > 0 ? activeRev.items : prev.items,
      };
    });
  };

  // Dedicated "Save" (in-place update): updates the current active draft directly without incrementing revision
  const handleSaveProject = (updatedProject: Project) => {
    const currentRevNum = updatedProject.activeRevisionNumber || "Rev.01";
    let updatedRevs = updatedProject.revisions ? [...updatedProject.revisions] : [];

    if (updatedRevs.length > 0) {
      let found = false;
      updatedRevs = updatedRevs.map((r) => {
        if (r.revisionNumber === currentRevNum) {
          found = true;
          return {
            ...r,
            itemCount: updatedProject.items?.length || 0,
            subtotal: updatedProject.subtotal || 0,
            grandTotal: updatedProject.grandTotal || 0,
            items: [...(updatedProject.items || [])],
            createdAt: new Date().toISOString().split("T")[0],
          };
        }
        return r;
      });
      if (!found) {
        updatedRevs.push({
          id: `rev-${updatedProject.id}-${Date.now()}`,
          projectId: updatedProject.id,
          revisionNumber: currentRevNum,
          title: `Draft ${currentRevNum}`,
          createdAt: new Date().toISOString().split("T")[0],
          isLatest: true,
          itemCount: updatedProject.items?.length || 0,
          subtotal: updatedProject.subtotal || 0,
          grandTotal: updatedProject.grandTotal || 0,
          items: [...(updatedProject.items || [])],
          notes: "Draft disimpan langsung",
        });
      }
    } else {
      updatedRevs = [
        {
          id: `rev-${updatedProject.id}-01`,
          projectId: updatedProject.id,
          revisionNumber: currentRevNum,
          title: "Initial Tender Draft",
          createdAt: new Date().toISOString().split("T")[0],
          isLatest: true,
          itemCount: updatedProject.items?.length || 0,
          subtotal: updatedProject.subtotal || 0,
          grandTotal: updatedProject.grandTotal || 0,
          items: [...(updatedProject.items || [])],
          notes: "Draft disimpan langsung",
        },
      ];
    }

    const finalProject: Project = {
      ...updatedProject,
      revisions: updatedRevs,
    };

    setProjects((prev) => {
      const exists = prev.some((p) => p.id === finalProject.id);
      if (exists) {
        return prev.map((p) =>
          p.id === finalProject.id ? finalProject : p
        );
      }
      return [finalProject, ...prev];
    });
    setEditingProject(finalProject);
  };

  // Handlers for Vendor CRUD
  const handleAddVendor = (newVendor: Vendor) => {
    setVendors((prev) => [newVendor, ...prev]);
  };

  const handleUpdateVendor = (updatedVendor: Vendor) => {
    setVendors((prev) =>
      prev.map((v) => (v.id === updatedVendor.id ? updatedVendor : v))
    );
  };

  const handleDeleteVendor = (id: string) => {
    setVendors((prev) => prev.filter((v) => v.id !== id));
  };

  const getMenuLabel = () => {
    switch (activeMenu) {
      case "project-list":
        return "Project List (Master Manajemen Proyek & Lifecycle Status)";
      case "rab-list":
        return "RAB List & Revision History Tree";
      case "schedule-list":
        return "Schedule List (Project Timeline & S-Curve Portfolio)";
      case "rab-draft":
        return editingProject
          ? `RAB Draft : [${editingProject.projectCode}] ${editingProject.name} (${editingProject.activeRevisionNumber || "Rev.01"})`
          : "RAB Draft : Select a Project";
      case "schedule-draft":
        return editingProject
          ? `Schedule Draft & S-Curve : [${editingProject.projectCode}] ${editingProject.name}`
          : "Schedule Draft : Select a Project";
      case "master-db":
        return "Master Database (AHS Costing Reference)";
      case "vendor-list":
        return "Vendor Directory (Contacts & Material Catalogs)";
      default:
        return "";
    }
  };

  return (
    <div className="w-full h-full flex flex-col overflow-hidden bg-slate-950 font-sans">
      {/* 1. Windows Desktop Frame Title Bar */}
      <TitleBar
        activeMenu={getMenuLabel()}
        onOpenCodeViewer={() => setIsCodeViewerOpen(true)}
      />

      {/* 2. Main Desktop Window Body */}
      <div className="flex-1 min-h-0 h-full flex overflow-hidden bg-slate-100">
        {/* Left Persistent Sidebar */}
        <Sidebar
          activeKey={activeMenu}
          onSelectMenu={(key) => {
            if ((key === "rab-draft" || key === "schedule-draft" || key === "interior-rab-draft") && !editingProject && projects.length > 0) {
              setEditingProject(projects[0]);
            }
            setActiveMenu(key);
          }}
          projectCount={projects.length}
          masterDbCount={masterItems.length}
          vendorCount={vendors.length}
          activeProjectCode={editingProject?.projectCode}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Right Dynamic Main Content Area */}
        <main className="flex-1 min-h-0 min-w-0 h-full flex flex-col bg-slate-100 relative overflow-hidden">
          {/* MENU 0: Dedicated Project List */}
          {activeMenu === "project-list" && (
            <ProjectList
              projects={projects}
              onOpenRabDraft={handleOpenRabDraft}
              onOpenScheduleDraft={handleOpenScheduleDraft}
              onCreateNewProject={handleCreateNewProject}
              onUpdateProjectStatus={handleUpdateProjectStatus}
              onUpdateProject={handleUpdateProject}
            />
          )}

          {/* MENU 1: RAB List (Accordion Tree) */}
          {activeMenu === "rab-list" && (
            <RabProjectList
              projects={projects}
              onOpenRabDraft={handleOpenRabDraft}
              onCreateNewProject={handleCreateNewProject}
              onCreateRevision={handleCreateRevision}
              onDuplicateRevision={handleDuplicateRevision}
              onDeleteRevision={handleDeleteRevision}
            />
          )}

          {/* MENU 2: Schedule List */}
          {activeMenu === "schedule-list" && (
            <ScheduleProjectList
              projects={projects}
              onOpenScheduleDraft={handleOpenScheduleDraft}
              onOpenRabDraft={handleOpenRabDraft}
            />
          )}

          {/* DRAFT VIEW 1: RAB Draft Editor */}
          {activeMenu === "rab-draft" && editingProject && (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Draft Context Navigation Strip */}
              <div className="bg-white border-b border-slate-200 px-6 py-2.5 flex flex-wrap items-center justify-between gap-3 shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setActiveMenu("rab-list")}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-md transition flex items-center gap-1 text-xs font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>RAB List</span>
                  </button>

                  <div className="h-4 w-px bg-slate-200"></div>

                  <span className="px-2 py-0.5 rounded bg-indigo-50 border border-indigo-200 text-indigo-700 font-mono font-bold text-xs">
                    {editingProject.projectCode}
                  </span>

                  <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200 font-mono font-bold text-xs flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    <span>RAB {editingProject.activeRevisionNumber || "Rev.01"}</span>
                  </span>

                  <span
                    className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                      PROJECT_STATUS_OPTIONS.find((s) => s.value === editingProject.status)?.badgeClass || "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {editingProject.status}
                  </span>

                  <div>
                    <h3 className="text-xs font-bold text-slate-900 leading-tight">
                      {editingProject.name}
                    </h3>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500">
                      <span>{editingProject.ownerName}</span>
                      <span>•</span>
                      <span>{editingProject.location}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveMenu("schedule-draft")}
                    className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Buka Schedule &amp; S-Curve</span>
                  </button>
                </div>
              </div>

              {/* RAB Workspace */}
              <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
                <CreateRabProject
                  masterItems={masterItems}
                  onSaveProject={handleSaveProject}
                  onSaveAsRevision={handleSaveAsRevision}
                  onNavigateToProjects={() => setActiveMenu("rab-list")}
                  editingProject={editingProject}
                />
              </div>
            </div>
          )}

          {/* DRAFT VIEW 2: Schedule Draft & S-Curve */}
          {activeMenu === "schedule-draft" && editingProject && (
            <ScheduleTracker
              project={editingProject}
              onUpdateProject={handleSaveProject}
              onNavigateBack={() => setActiveMenu("schedule-list")}
              onSwitchToRab={() => setActiveMenu("rab-draft")}
            />
          )}

          {/* Master Database (AHS) */}
          {activeMenu === "master-db" && (
            <MasterDatabase
              masterItems={masterItems}
              onAddItem={handleAddMasterItem}
              onUpdateItem={handleUpdateMasterItem}
              onDeleteItem={handleDeleteMasterItem}
              categories={categories}
            />
          )}

          {/* Vendor Directory */}
          {activeMenu === "vendor-list" && (
            <VendorList
              vendors={vendors}
              categories={categories}
              onAddVendor={handleAddVendor}
              onUpdateVendor={handleUpdateVendor}
              onDeleteVendor={handleDeleteVendor}
              onAddCategory={handleAddCategory}
            />
          )}
          {/* Category Management */}
          {activeMenu === "category-management" && (
            <CategoryManagement
              categories={categories}
              onAddCategory={handleAddCategory}
              onUpdateCategory={handleUpdateCategory}
              onDeleteCategory={handleDeleteCategory}
            />
          )}

          {/* INTERIOR MASTER MODULE (ISOLATED WORKSPACE) */}
          {activeMenu === "interior-project-list" && (
            <InteriorProjectList
              projects={interiorProjects}
              onOpenRabDraft={handleOpenInteriorRabDraft}
              onOpenScheduleDraft={() => {}}
              onCreateNewInteriorProject={(data) => {
                const newPrj: InteriorProject = {
                  id: `iprj-${Date.now()}`,
                  projectCode: data.projectCode || `IPRJ-2026-${String(interiorProjects.length + 1).padStart(3, "0")}`,
                  name: data.name || "New Interior Project",
                  description: data.description || "",
                  ownerName: data.ownerName || "Client",
                  location: data.location || "Location",
                  status: (data.status as ProjectStatus) || "On Tender",
                  createdAt: new Date().toISOString().split("T")[0],
                  requirements: data.requirements || {
                    landArea: 200,
                    buildingArea: 150,
                    floorsCount: 2,
                    ceilingHeight: 3.2,
                    designStyle: 'Modern Minimalist',
                    finishingGrade: 'Deluxe (Medium)',
                    scopeOfWork: ['Interior Fit-Out']
                  },
                  revisions: [
                    {
                      id: `rev-${Date.now()}`,
                      name: "Initial Draft",
                      date: new Date().toISOString().split("T")[0],
                      version: 1,
                      isDraft: true,
                      usePpn: false,
                      sections: [],
                      grandTotal: 0
                    }
                  ]
                };
                setInteriorProjects([newPrj, ...interiorProjects]);
              }}
              onUpdateProjectStatus={handleUpdateInteriorProjectStatus}
              onUpdateInteriorProject={handleUpdateInteriorProject}
            />
          )}
          {activeMenu === "interior-rab-list" && (
            <InteriorRabList
              projects={interiorProjects}
              onOpenDraft={handleOpenInteriorRabDraft}
              onCreateProject={handleCreateInteriorProject}
            />
          )}
          {activeMenu === "interior-master-db" && (
            <InteriorDatabaseSpecification
              specDB={interiorSpecDB}
              onUpdateDB={setInteriorSpecDB}
            />
          )}
          {activeMenu === "interior-rab-draft" && editingInteriorProject && (
            <InteriorRabDraft 
              key={`${editingInteriorProject.id}-${editingInteriorRevisionId || 'latest'}`}
              project={editingInteriorProject} 
              initialRevisionId={editingInteriorRevisionId}
              specDatabase={interiorSpecDB}
              onClose={() => setActiveMenu("interior-project-list")}
              onSave={handleSaveInteriorProject}
            />
          )}
        </main>
      </div>

      {/* 3. Source Code & SQLite Schema Viewer Modal */}
      <SourceCodeViewer
        isOpen={isCodeViewerOpen}
        onClose={() => setIsCodeViewerOpen(false)}
      />
    </div>
  );
}
