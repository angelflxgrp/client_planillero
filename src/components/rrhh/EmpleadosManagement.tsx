import * as React from "react";
import { useState, useEffect, useCallback } from "react";
import { Box, Typography, Snackbar, Alert } from "@mui/material";
import { useNavigate, useOutletContext } from "react-router-dom";
import EmpleadoService from "../../services/empleadoService";
import { empresaService } from "../../services/empresaService";
import type { Empleado } from "../../services/empleadoService";
import type { Empresa } from "../../types/auth";
import EmpleadosList from "./gestion-empleados/EmpleadosList";
import EmpleadoFormModal from "./gestion-empleados/EmpleadoFormModal";
import EmpleadoDetailModal from "./gestion-empleados/EmpleadoDetailModal";
import EmpleadosFilters from "./gestion-empleados/EmpleadosFilters";
import type { LayoutOutletCtx } from "../Layout";

const EmpleadosManagement: React.FC = () => {
  const navigate = useNavigate();

  // 👉 Trae setters/estado compartido desde el Layout (Outlet Context)
  const { setSelectedEmpleado } = useOutletContext<LayoutOutletCtx>();

  // Estados principales
  const [empleados, setEmpleados] = useState<Empleado[]>([]);
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedEmpresaId, setSelectedEmpresaId] = useState<string>("");

  // Estados para modales
  const [openFormModal, setOpenFormModal] = useState(false);
  const [openDetailModal, setOpenDetailModal] = useState(false);
  const [currentEmpleado, setCurrentEmpleado] = useState<Empleado | null>(null);

  // Estado para notificaciones
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({
    open: false,
    message: "",
    severity: "success",
  });

  // Función para mostrar notificaciones
  const showSnackbar = useCallback(
    (message: string, severity: "success" | "error") => {
      setSnackbar({ open: true, message, severity });
    },
    []
  );

  // Funciones para cargar datos
  const fetchEmpleados = useCallback(async () => {
    setLoading(true);
    try {
      const empresaId = selectedEmpresaId ? parseInt(selectedEmpresaId) : undefined;
      const data = await EmpleadoService.getAll(empresaId);
      setEmpleados(data);
    } catch (err) {
      console.error("Error al cargar empleados:", err);
      showSnackbar("Error al cargar los colaboradores", "error");
    } finally {
      setLoading(false);
    }
  }, [selectedEmpresaId, showSnackbar]);

  const fetchEmpresas = useCallback(async () => {
    try {
      const response = await empresaService.getEmpresas();
      if (response.success) setEmpresas(response.data);
    } catch (err) {
      console.error("Error al cargar empresas:", err);
      showSnackbar("Error al cargar las empresas", "error");
    }
  }, [showSnackbar]);

  // Cargar datos iniciales
  useEffect(() => {
    fetchEmpresas();
  }, [fetchEmpresas]);

  useEffect(() => {
    fetchEmpleados();
  }, [fetchEmpleados]);

  // Modales
  const handleOpenCreateModal = () => {
    setCurrentEmpleado(null);
    setOpenFormModal(true);
  };

  const handleOpenEditModal = (empleado: Empleado) => {
    setCurrentEmpleado(empleado);
    setOpenFormModal(true);
  };

  const handleCloseFormModal = () => {
    setOpenFormModal(false);
    setCurrentEmpleado(null);
  };

  const handleOpenDetailModal = async (empleado: Empleado) => {
    try {
      const empleadoCompleto = await EmpleadoService.getById(empleado.id);
      setCurrentEmpleado(empleadoCompleto);
      setOpenDetailModal(true);
    } catch (err) {
      console.error("Error al cargar detalles del colaborador:", err);
      showSnackbar("Error al cargar los detalles del colaborador", "error");
    }
  };

  const handleCloseDetailModal = () => {
    setOpenDetailModal(false);
    setCurrentEmpleado(null);
  };

  const handleEditFromDetail = () => {
    setOpenDetailModal(false);
    setOpenFormModal(true);
  };

  // CRUD
  const handleDeleteEmpleado = async (id: number) => {
    if (window.confirm("¿Está seguro que desea eliminar este colaborador?")) {
      try {
        await EmpleadoService.delete(id);
        showSnackbar("Colaborador eliminado exitosamente", "success");
        fetchEmpleados();
      } catch (err) {
        console.error("Error al eliminar empleado:", err);
        showSnackbar("Error al eliminar el colaborador", "error");
      }
    }
  };

  const handleFormSuccess = (message: string) => {
    showSnackbar(message, "success");
    fetchEmpleados();
  };

  const handleFormError = (message: string) => {
    showSnackbar(message, "error");
  };

  // 👉 Navegación a Nóminas usando contexto (persiste al cambiar de ruta)
  const handleNominaClick = (empleado: Empleado) => {
    setSelectedEmpleado(empleado);
    navigate("/rrhh/nominas");
  };

  const handleCloseSnackbar = (): void => {
    setSnackbar((s) => ({ ...s, open: false }));
  };

  // Filtro
  const filteredEmpleados = empleados.filter((empleado) => {
    const q = searchTerm.toLowerCase();
    return (
      empleado.nombre?.toLowerCase().includes(q) ||
      empleado.apellido?.toLowerCase().includes(q) ||
      empleado.codigo?.toLowerCase().includes(q) ||
      empleado.correoElectronico?.toLowerCase().includes(q) ||
      empleado.cargo?.toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Gestión de Colaboradores
      </Typography>

      {/* Filtros */}
      <Box sx={{ mb: 3 }}>
        <EmpleadosFilters
          searchTerm={searchTerm}
          selectedEmpresaId={selectedEmpresaId}
          empresas={empresas}
          onSearchChange={setSearchTerm}
          onEmpresaChange={setSelectedEmpresaId}
          onCreateNew={handleOpenCreateModal}
        />
      </Box>

      {/* Lista */}
      <EmpleadosList
        empleados={filteredEmpleados}
        loading={loading}
        onView={handleOpenDetailModal}
        onEdit={handleOpenEditModal}
        onDelete={handleDeleteEmpleado}
        onNominaClick={handleNominaClick}
      />

      {/* Modal Form */}
      <EmpleadoFormModal
        open={openFormModal}
        onClose={handleCloseFormModal}
        onSuccess={handleFormSuccess}
        onError={handleFormError}
        empleado={currentEmpleado}
        empresas={empresas}
      />

      {/* Modal Detalle */}
      <EmpleadoDetailModal
        open={openDetailModal}
        onClose={handleCloseDetailModal}
        onEdit={handleEditFromDetail}
        empleado={currentEmpleado}
      />

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EmpleadosManagement;
