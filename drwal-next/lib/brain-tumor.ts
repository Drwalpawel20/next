/** Mapowanie nazw klas i istotności – port z Pythona (class_label, significance, significance_color). */
const PL_TUMOR_NAMES: Record<string, string> = {
  Astrocytoma: "Gwiaździak",
  Ependymoma: "Wyściółczak",
  Glioma: "Glejak",
  Hemangiopericytoma: "Hemangiopericytoma",
  Meningioma: "Oponiak",
  Neurocytoma: "Neurocytoma",
  Normal: "Obraz prawidłowy",
  Oligodendroglioma: "Skąpodrzewiak",
  Other: "Inna zmiana",
  Schwannoma: "Nerwiak osłonkowy",
};

export function classLabelPl(name: string): string {
  const parts = name.split(" ");
  if (parts.length < 2) return name;
  const seq = parts[parts.length - 1];
  const tumor = parts.slice(0, -1).join(" ");
  return `${PL_TUMOR_NAMES[tumor] ?? tumor} ${seq}`.trim();
}

export function significance(p: number): { label: string; color: string } {
  if (p >= 0.75) return { label: "wysoka", color: "#34d399" };
  if (p >= 0.45) return { label: "umiarkowana", color: "#fbbf24" };
  return { label: "niska", color: "#8a94a6" };
}
