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
    endDate?: string;
    startTime?: string;
    endTime?: string;
    hours?: number;
    days?: number;
    travelers?: number | string;
    total: number;
    deposit: number;
    bookingType?: string;
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
        <div style="background: #111; padding: 20px; text-align: center; border-radius: 12px 12px 0 0;">
            <h1 style="margin: 0; color: #f59e0b; font-size: 24px; letter-spacing: 2px;">VANAEROPORT</h1>
            <p style="margin: 5px 0 0; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 1px;">Service de Transport Premium</p>
        </div>
        
        <div style="padding: 25px; border: 1px solid #eee; border-top: none; border-radius: 0 0 12px 12px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 25px; border-bottom: 1px solid #f0f0f0; padding-bottom: 15px;">
                <div>
                    <p style="margin: 0; font-size: 10px; color: #999; text-transform: uppercase;">Référence</p>
                    <p style="margin: 2px 0 0; font-size: 16px; font-weight: bold; color: #f59e0b;">#${receiptId}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 10px; color: #999; text-transform: uppercase;">Émis le</p>
                    <p style="margin: 2px 0 0; font-size: 12px; font-weight: bold;">${date}</p>
                </div>
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 25px;">
                <div>
                    <p style="margin: 0; font-size: 10px; color: #999; text-transform: uppercase;">Passager</p>
                    <p style="margin: 2px 0 0; font-size: 13px; font-weight: bold;">${data.fullName || 'Client Premium'}</p>
                    <p style="margin: 2px 0 0; font-size: 11px; color: #666;">${data.phone || ''}</p>
                </div>
                <div style="text-align: right;">
                    <p style="margin: 0; font-size: 10px; color: #999; text-transform: uppercase;">Véhicule</p>
                    <p style="margin: 2px 0 0; font-size: 13px; font-weight: bold;">${data.vehicleName || 'Van Premium'}</p>
                </div>
            </div>

            <div style="background: #fcfcfc; padding: 15px; border-radius: 10px; margin-bottom: 25px; border: 1px solid #f0f0f0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                    <div style="width: 45%;">
                        <p style="margin: 0; font-size: 9px; color: #999; text-transform: uppercase;">📍 Départ</p>
                        <p style="margin: 3px 0 0; font-size: 11px; font-weight: bold;">${data.pickup || 'Abidjan'}</p>
                    </div>
                    <div style="width: 10%; text-align: center; align-self: center; color: #f59e0b;">➔</div>
                    <div style="width: 45%; text-align: right;">
                        <p style="margin: 0; font-size: 9px; color: #999; text-transform: uppercase;">🏁 Destination</p>
                        <p style="margin: 3px 0 0; font-size: 11px; font-weight: bold;">${data.destination || 'Aéroport'}</p>
                    </div>
                </div>
                
                <div style="border-top: 1px dashed #ddd; padding-top: 15px; display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                    <div>
                        <p style="margin: 0; font-size: 9px; color: #999; text-transform: uppercase;">📅 ${data.bookingType === 'rental' ? 'Date Début' : 'Date de prise en charge'}</p>
                        <p style="margin: 3px 0 0; font-size: 11px; font-weight: bold;">${data.date || data.startDate} à ${data.startTime}</p>
                    </div>
                    ${data.endDate ? `
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 9px; color: #999; text-transform: uppercase;">📅 Date de Fin</p>
                        <p style="margin: 3px 0 0; font-size: 11px; font-weight: bold;">${data.endDate} à ${data.endTime || '18:00'}</p>
                    </div>` : `
                    <div style="text-align: right;">
                        <p style="margin: 0; font-size: 9px; color: #999; text-transform: uppercase;">📋 Détails</p>
                        <p style="margin: 3px 0 0; font-size: 11px; font-weight: bold;">
                            ${data.hours ? `${data.hours} heure(s)` : data.travelers ? `${data.travelers} Passager(s)` : 'Course Standard'}
                        </p>
                    </div>`}
                </div>
                ${data.days ? `
                <div style="margin-top: 10px; text-align: center; background: #eee; padding: 5px; border-radius: 5px;">
                    <p style="margin: 0; font-size: 10px; font-weight: bold;">DURÉE TOTALE : ${data.days} JOUR(S)</p>
                </div>` : ''}
            </div>

            <div style="border: 2px solid #111; padding: 20px; border-radius: 12px; background: #fff;">
                <div style="text-align: center; margin-bottom: 15px;">
                    ${data.deposit >= data.total ? `
                        <span style="background: #111; color: #f59e0b; padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; display: inline-block; line-height: 1; border: 1px solid #f59e0b;">REGLEMENT TOTAL - 100% PAYÉ</span>
                    ` : `
                        <span style="background: #059669; color: white; padding: 6px 16px; border-radius: 20px; font-size: 10px; font-weight: bold; text-transform: uppercase; display: inline-block; line-height: 1;">ACOMPTE 30% CONFIRMÉ</span>
                    `}
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
                    <span style="font-size: 12px; color: #666;">Montant Total</span>
                    <span style="font-size: 14px; font-weight: bold;">${data.total.toLocaleString('fr-FR')} F CFA</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 8px; color: #059669;">
                    <span style="font-size: 12px; font-weight: bold;">${data.deposit >= data.total ? 'Total Réglé' : 'Acompte Payé'}</span>
                    <span style="font-size: 14px; font-weight: bold;">${data.deposit.toLocaleString('fr-FR')} F CFA</span>
                </div>
                <div style="display: flex; justify-content: space-between; border-top: 2px solid #111; pt: 10px; margin-top: 10px;">
                    <span style="font-size: 13px; font-weight: bold; padding-top: 8px;">RESTE À PAYER</span>
                    <span style="font-size: 20px; font-weight: bold; color: ${data.deposit >= data.total ? '#059669' : '#f59e0b'}; padding-top: 8px;">
                        ${Math.max(0, data.total - data.deposit).toLocaleString('fr-FR')} F
                    </span>
                </div>
            </div>

            <div style="text-align: center; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
                <p style="font-size: 10px; color: #999; font-style: italic; margin-bottom: 5px;">
                    ${data.deposit >= data.total ? 'Ce document est une facture finale certifiant le paiement intégral.' : 'Ce reçu fait office de confirmation officielle d\'acompte.'}
                </p>
                <p style="font-size: 9px; color: #bbb; text-transform: uppercase; font-weight: bold;">Vanaeroport Abidjan - Côte d'Ivoire</p>
            </div>
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
