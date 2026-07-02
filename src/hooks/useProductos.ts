import { useState, useEffect } from "react";

export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  stock: number;
  categoria: string;
  marca: string;
  descripcion: string;
}

export function useProductos() {
  const [productos, setProductos] = useState<Producto[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const guardados = localStorage.getItem("dulces_aromas_productos");
    if (guardados) {
      setProductos(JSON.parse(guardados));
      setCargando(false);
    } else {
      fetch("/productos.json")
        .then(r => r.json())
        .then(data => {
          setProductos(data);
          localStorage.setItem("dulces_aromas_productos", JSON.stringify(data));
          setCargando(false);
        })
        .catch(() => setCargando(false));
    }
  }, []);

  return { productos, cargando };
}
