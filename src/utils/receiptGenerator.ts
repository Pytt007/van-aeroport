import jsPDF from "jspdf";
import html2canvas from "html2canvas";

interface ReceiptData {
    fullName?: string;
    phone?: string;
    vehicleName?: string;
    pickup?: string;
    destination?: string;
    date?: string;
    startDate?: string;
    startTime?: string;
    hours?: number;
    days?: number;
    total: number | string;
}

export const generateReceiptPDF = async (receiptId: string, data: ReceiptData) => {
    // Create a temporary element to render the receipt
    const element = document.createElement("div");
    element.style.padding = "40px";
    element.style.width = "400px";
    element.style.background = "white";
    element.style.color = "black";
    element.style.fontFamily = "sans-serif";
    element.style.position = "absolute";
    element.style.left = "-9999px";

    const date = new Date().toLocaleDateString("fr-FR");

    element.innerHTML = `
        <div style="text-align: center; margin-bottom: 20px;">
            <h1 style="margin: 0; color: #f59e0b;">VANAEROPORT</h1>
            <p style="margin: 5px 0; font-size: 12px; color: #666;">Service de Transport Premium</p>
        </div>
        
        <div style="border-top: 2px solid #eee; border-bottom: 2px solid #eee; padding: 15px 0; margin-bottom: 20px;">
            <p style="margin: 5px 0; font-size: 14px;"><strong>Reçu N° :</strong> ${receiptId}</p>
            <p style="margin: 5px 0; font-size: 14px;"><strong>Date :</strong> ${date}</p>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails du Client</h3>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Nom :</strong> ${data.fullName || '—'}</p>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Téléphone :</strong> ${data.phone || '—'}</p>
        </div>

        <div style="margin-bottom: 20px;">
            <h3 style="font-size: 16px; border-bottom: 1px solid #eee; padding-bottom: 5px;">Détails de la Commande</h3>
            <p style="margin: 5px 0; font-size: 13px;"><strong>Service :</strong> ${data.vehicleName || 'Van Premium'}</p>
            ${data.pickup ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Départ :</strong> ${data.pickup}</p>` : ''}
            ${data.destination ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Destination :</strong> ${data.destination}</p>` : ''}
            ${data.date || data.startDate ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Date :</strong> ${data.date || data.startDate}</p>` : ''}
            ${data.startTime ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Heure :</strong> ${data.startTime}</p>` : ''}
            ${data.hours ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Durée :</strong> ${data.hours} heure(s)</p>` : ''}
            ${data.days ? `<p style="margin: 5px 0; font-size: 13px;"><strong>Durée :</strong> ${data.days} jour(s)</p>` : ''}
        </div>

        <div style="background: #f9f9f9; padding: 15px; border-radius: 8px; text-align: right;">
            <p style="margin: 0; font-size: 12px; color: #666;">Montant Total Estimé</p>
            <h2 style="margin: 5px 0; color: #000;">${typeof data.total === 'number' ? data.total.toLocaleString('fr-FR') + ' F CFA' : data.total || 'À confirmer'}</h2>
        </div>

        <div style="text-align: center; margin-top: 30px; font-size: 10px; color: #999;">
            <p>Ce document est un reçu provisoire généré par l'application.</p>
            <p>Vanaeroport vous remercie de votre confiance !</p>
        </div>
    `;

    document.body.appendChild(element);

    try {
        const canvas = await html2canvas(element, {
            scale: 2,
            backgroundColor: "#ffffff",
        });
        const imgData = canvas.toDataURL("image/png");
        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "mm",
            format: [canvas.width * 0.1, canvas.height * 0.1], // Adjust to canvas size
        });

        const imgWidth = pdf.internal.pageSize.getWidth();
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);
        pdf.save(`Recu_${receiptId}.pdf`);
    } catch (error) {
        console.error("Failed to generate PDF", error);
        throw error;
    } finally {
        document.body.removeChild(element);
    }
};
