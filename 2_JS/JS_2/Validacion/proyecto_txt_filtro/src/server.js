import express from "express";
import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const app = express();
const upload = multer({ dest: "uploads/" });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../views/index.html"));
});

function isFactorial(n) {
  if (!Number.isInteger(n) || n < 1) return false;
  let acc = 1;
  let i = 1;
  while (acc < n) {
    i++;
    acc *= i;
  }
  return acc === n;
}

app.post("/upload", upload.single("txtfile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No se subió ningún archivo." });
    }

    const fileContent = await fs.readFile(req.file.path, "utf8");
    const lines = fileContent.split(/\r?\n/).map(line => line.trim()).filter(Boolean);

    const invalid = lines.filter(line => !/^\d+$/.test(line));
    if (invalid.length > 0) {
      await fs.unlink(req.file.path);
      return res.status(400).json({
        message: "este txt no cumple con la validacion"
      });
    }

    const numbers = lines.map(Number);
    const useful = numbers.filter(n => {
      const s = String(n);
      return s[0] === s[s.length - 1];
    });

    const notUseful = numbers.filter(n => {
      const s = String(n);
      return s[0] !== s[s.length - 1];
    });

    const factorials = numbers.filter(isFactorial);

    const total = numbers.length;
    const utiles = useful.length;
    const noUtiles = notUseful.length;
    const porcentajeUtiles = total ? ((utiles / total) * 100).toFixed(2) : "0.00";

    const sortedUseful = [...useful].sort((a, b) => a - b);

    const resultText = [
      "NUMEROS UTILES ORDENADOS ASCENDENTE",
      ...sortedUseful.map(n => String(n)),
      "",
      `TOTAL NUMEROS: ${total}`,
      `NUMEROS UTILES: ${utiles}`,
      `NUMEROS NO UTILES: ${noUtiles}`,
      `PORCENTAJE DE NUMEROS UTILES: ${porcentajeUtiles}%`,
      "",
      "NUMEROS FACTORIALES",
      ...(factorials.length ? factorials.map(n => String(n)) : ["No se encontraron factoriales"])
    ].join("\n");

    const outputName = `resultado_${Date.now()}.txt`;
    const outputPath = path.join(__dirname, "../uploads", outputName);
    await fs.writeFile(outputPath, resultText, "utf8");

    await fs.unlink(req.file.path);

    return res.json({
      message: "Archivo procesado correctamente.",
      useful: sortedUseful,
      total,
      utiles,
      noUtiles,
      porcentajeUtiles,
      factorials,
      outputFile: outputName,
      resultText
    });
  } catch (error) {
    return res.status(500).json({ message: "Error del servidor." });
  }
});

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});