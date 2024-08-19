import React, { useEffect, useState } from "react";
import axios from "axios";
import { IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  DataGrid,
  GridToolbar,
  GridRowsProp,
  GridColDef,
} from "@mui/x-data-grid";
import "./consultabfx.scss";
import jsPDF from "jspdf";
import ArticleIcon from "@mui/icons-material/Article";

interface RowData {
  id: number;
  area: string;
  fecha: string;
  claveProducto: string;
  nombreProducto: string;
  turno: string;
  operador: string;
  pesoBruto: number;
  pesoNeto: number;
  pesoTarima: number;
  piezas: number;
  trazabilidad: string;
  orden: number;
  rfid: string;
  uom: string;
  status: string;
}

const getClaveUnidad = (uom: string | null): string => {
  switch (uom) {
    case "Millares":
      return "MIL";
    case "Piezas":
      return "PZAS";
    case "Cajas":
      return "XBX";
    default:
      return "";
  }
};

const ConsultaBFX: React.FC = () => {
  const navigate = useNavigate();
  const [rows, setRows] = useState<GridRowsProp>([]);

  useEffect(() => {
    axios
      .get("http://172.16.10.31/api/RfidLabel")
      .then((response) => setRows(response.data))
      .catch((error) => console.error("Error fetching data:", error));
  }, []);

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 100 },
    { field: "area", headerName: "Área", width: 150 },
    { field: "fecha", headerName: "Fecha", width: 150 },
    { field: "claveProducto", headerName: "Clave Producto", width: 120 },
    { field: "nombreProducto", headerName: "Nombre Producto", width: 200 },
    { field: "turno", headerName: "Turno", width: 100 },
    { field: "operador", headerName: "Operador", width: 150 },
    {
      field: "pesoTarima",
      headerName: "Peso Tarima",
      type: "number",
      width: 130,
    },
    {
      field: "pesoBruto",
      headerName: "Peso Bruto",
      type: "number",
      width: 130,
    },
    { field: "pesoNeto", headerName: "Peso Neto", type: "number", width: 130 },
    { field: "piezas", headerName: "Piezas", type: "number", width: 100 },
    { field: "trazabilidad", headerName: "Trazabilidad", width: 150 },
    { field: "orden", headerName: "Orden", width: 120 },
    { field: "rfid", headerName: "RFID", width: 150 },
    { field: "status", headerName: "Estado", width: 100 },
    { field: "uom", headerName: "UOM", width: 100 },
    {
      field: "acciones",
      headerName: "Acciones",
      sortable: false,
      filterable: false,
      width: 250,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleGeneratePDFClick(params.row)}>
            <ArticleIcon />
          </IconButton>
        </>
      ),
    },
  ];

  const handleGeneratePDFClick = (row: RowData) => {
    generatePDF(row);
  };

  const formatDate = (dateTime: string): string => {
    const date = new Date(dateTime);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0"); // Meses comienzan en 0
    const year = date.getFullYear();
    return `${day}-${month}-${year}`;
  };

  const generatePDF = (data: RowData) => {
    const {
      claveProducto,
      nombreProducto,
      pesoBruto,
      orden,
      fecha,
      pesoNeto,
      piezas,
    } = data;
    const claveUnidad = getClaveUnidad(data.uom);
    const formattedDate = formatDate(fecha);

    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: "letter",
    });

    const splitText = (
      text: string,
      x: number,
      y: number,
      fontSize: number,
      maxWidth: number
    ): number => {
      doc.setFontSize(fontSize);
      const lines: string[] = doc.splitTextToSize(text, maxWidth);
      lines.forEach((line: string) => {
        doc.text(line, x, y);
        y += fontSize * 0.4;
      });
      return y;
    };

    doc.setFontSize(150);
    doc.text(`${claveProducto}`, 25, 45);

    let currentY = 80;
    currentY = splitText(nombreProducto, 10, currentY, 45, 260);

    doc.setFontSize(40);
    doc.text(`LOTE:${orden}`, 20, 161);
    doc.text(`${formattedDate} `, 155, 161);

    doc.text(`KGM`, 80, 180);

    doc.setFontSize(80);
    doc.text(`${pesoNeto}`, 5, 207);
    doc.text(`${piezas} ${claveUnidad}`, 122, 207);

    doc.setDrawColor(0);
    doc.setLineWidth(0.5);
    doc.line(5, 55, 275, 55);
    doc.line(5, 145, 275, 145);
    doc.line(5, 167, 275, 167);
    doc.line(117, 167, 117, 210);
    window.open(doc.output("bloburl"), "_blank");
  };

  return (
    <div className="consulta-bfx">
      <IconButton
        onClick={() => navigate("/consultas")}
        sx={{ position: "absolute", top: 16, left: 16 }}
      >
        <ArrowBackIcon sx={{ fontSize: 40, color: "#46707e" }} />
      </IconButton>
      <Typography variant="h4" sx={{ textAlign: "center", mt: 4, mb: 4 }}>
        CONSULTA PT BIOFLEX
      </Typography>
      <div className="data-grid-container">
        <DataGrid
          columns={columns}
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          slots={{ toolbar: GridToolbar }}
          slotProps={{ toolbar: { showQuickFilter: true } }}
          rows={rows}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: 25,
              },
            },
          }}
          pageSizeOptions={[5, 10, 25, 50, 100]}
          pagination
          className="MuiDataGrid-root"
        />
      </div>
    </div>
  );
};

export default ConsultaBFX;
