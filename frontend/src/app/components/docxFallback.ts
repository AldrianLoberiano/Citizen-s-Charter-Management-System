import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  HeadingLevel,
  ImageRun,
  convertInchesToTwip,
  ShadingType,
} from "docx";

function dataUriToBuffer(dataUri: string): {
  buffer: ArrayBuffer;
  type: string;
} | null {
  const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  const type = match[1];
  const binary = atob(match[2]);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return { buffer: bytes.buffer, type };
}

function getCellShading(el: HTMLElement): string | undefined {
  const style = el.getAttribute("style") || "";
  const bgMatch = style.match(/background(?:-color)?:\s*([^;]+)/i);
  if (bgMatch) {
    let color = bgMatch[1].trim();
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.fillStyle = color;
      color = ctx.fillStyle;
    }
    if (color.startsWith("#")) color = color.slice(1);
    return color.toUpperCase();
  }
  const bg = el.getAttribute("bgcolor");
  if (bg) {
    let color = bg.trim();
    const ctx = document.createElement("canvas").getContext("2d");
    if (ctx) {
      ctx.fillStyle = color;
      color = ctx.fillStyle;
    }
    if (color.startsWith("#")) color = color.slice(1);
    return color.toUpperCase();
  }
  return undefined;
}

function getDepth(el: HTMLElement): number {
  let depth = 0;
  let parent = el.parentElement;
  while (parent) {
    const tag = parent.tagName.toLowerCase();
    if (tag === "ul" || tag === "ol") depth++;
    parent = parent.parentElement;
  }
  return depth;
}

function parseInline(element: HTMLElement, inheritedColor?: string): TextRun[] {
  const runs: TextRun[] = [];
  const elColor = (() => {
    const style = element.getAttribute("style") || "";
    const m = style.match(/color:\s*([^;]+)/i);
    if (m) {
      let c = m[1].trim();
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) { ctx.fillStyle = c; c = ctx.fillStyle; }
      if (c.startsWith("#")) c = c.slice(1);
      return c.toUpperCase();
    }
    return undefined;
  })();
  const color = elColor || inheritedColor;

  element.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent || "";
      if (text) {
        const isBold = element.tagName === "B" || element.tagName === "STRONG";
        const isItalic = element.tagName === "I" || element.tagName === "EM";
        const isUnderline = element.tagName === "U";
        runs.push(
          new TextRun({
            text,
            bold: isBold,
            italics: isItalic,
            underline: isUnderline ? {} : undefined,
            color,
          })
        );
      }
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      const cel = child as HTMLElement;
      const tag = cel.tagName;
      const isBold = tag === "B" || tag === "STRONG";
      const isItalic = tag === "I" || tag === "EM";
      const isUnderline = tag === "U";
      cel.childNodes.forEach((gc) => {
        if (gc.nodeType === Node.TEXT_NODE) {
          const t = gc.textContent || "";
          if (t)
            runs.push(
              new TextRun({
                text: t,
                bold: isBold,
                italics: isItalic,
                underline: isUnderline ? {} : undefined,
                color,
              })
            );
        } else if (gc.nodeType === Node.ELEMENT_NODE) {
          const gcel = gc as HTMLElement;
          const gt = gcel.tagName;
          runs.push(
            new TextRun({
              text: gcel.textContent || "",
              bold: isBold || gt === "B" || gt === "STRONG",
              italics: isItalic || gt === "I" || gt === "EM",
              underline: isUnderline || gt === "U" ? {} : undefined,
              color,
            })
          );
        }
      });
    }
  });
  return runs.length > 0 ? runs : [new TextRun("")];
}

function htmlToDocxElements(htmlStr: string): (Paragraph | Table)[] {
  const div = document.createElement("div");
  div.innerHTML = htmlStr;
  const elements: (Paragraph | Table)[] = [];

  function processNode(node: ChildNode) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || "";
      if (text.trim())
        elements.push(
          new Paragraph({ children: [new TextRun(text)] })
        );
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    if (tag === "img") {
      const src = el.getAttribute("src") || "";
      const imgData = dataUriToBuffer(src);
      if (imgData) {
        const ext = imgData.type.split("/")[1] || "png";
        elements.push(
          new Paragraph({
            children: [
              new ImageRun({
                data: imgData.buffer,
                transformation: { width: 400, height: 300 },
                type: ext as "png" | "jpg" | "gif",
              }),
            ],
          })
        );
      }
      return;
    }

    if (tag === "table") {
      const rows: TableRow[] = [];
      el.querySelectorAll("tr").forEach((tr) => {
        const cells: TableCell[] = [];
        tr.querySelectorAll("td, th").forEach((td) => {
          const cellParagraphs: Paragraph[] = [];
          const cellColor = (() => {
            const style = td.getAttribute("style") || "";
            const m = style.match(/color:\s*([^;]+)/i);
            if (m) {
              let c = m[1].trim();
              const ctx = document.createElement("canvas").getContext("2d");
              if (ctx) { ctx.fillStyle = c; c = ctx.fillStyle; }
              if (c.startsWith("#")) c = c.slice(1);
              return c.toUpperCase();
            }
            return undefined;
          })();
          td.childNodes.forEach((child) => {
            if (child.nodeType === Node.TEXT_NODE) {
              const t = child.textContent || "";
              if (t) {
                if (/[►▸•‣]/.test(t)) {
                  const parts = t.split(/[►▸•‣]/).map((s) => s.trim()).filter(Boolean);
                  parts.forEach((part) => {
                    cellParagraphs.push(
                      new Paragraph({
                        children: [
                          new TextRun({
                            text: part,
                            bold: td.tagName === "TH",
                            color: cellColor,
                          }),
                        ],
                        bullet: { level: 0 },
                      })
                    );
                  });
                } else {
                  cellParagraphs.push(
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: t,
                          bold: td.tagName === "TH",
                          color: cellColor,
                        }),
                      ],
                    })
                  );
                }
              }
            } else if (child.nodeType === Node.ELEMENT_NODE) {
              const parsed = htmlToDocxElements((child as HTMLElement).outerHTML);
              for (const el of parsed) {
                if (el instanceof Paragraph) {
                  cellParagraphs.push(el);
                }
              }
            }
          });
          if (cellParagraphs.length === 0)
            cellParagraphs.push(
              new Paragraph({ children: [new TextRun("")] })
            );
          const shading = getCellShading(td as HTMLElement);
          cells.push(
            new TableCell({
              children: cellParagraphs,
              width: {
                size: Math.floor(
                  100 /
                    Math.max(tr.querySelectorAll("td, th").length, 1)
                ),
                type: WidthType.PERCENTAGE,
              },
              shading: shading
                ? {
                    type: ShadingType.CLEAR,
                    fill: shading,
                  }
                : undefined,
            })
          );
        });
        if (cells.length > 0) rows.push(new TableRow({ children: cells }));
      });
      if (rows.length > 0) elements.push(new Table({ rows }));
      return;
    }

    if (/^h([1-6])$/.test(tag)) {
      const level = Number(tag[1]);
      const headingMap: Record<
        number,
        (typeof HeadingLevel)[keyof typeof HeadingLevel]
      > = {
        1: HeadingLevel.HEADING_1,
        2: HeadingLevel.HEADING_2,
        3: HeadingLevel.HEADING_3,
        4: HeadingLevel.HEADING_4,
        5: HeadingLevel.HEADING_5,
        6: HeadingLevel.HEADING_6,
      };
      elements.push(
        new Paragraph({
          children: [
            new TextRun({ text: el.textContent || "", bold: true }),
          ],
          heading: headingMap[level] || HeadingLevel.HEADING_1,
        })
      );
      return;
    }

    if (tag === "p") {
      elements.push(new Paragraph({ children: parseInline(el) }));
      return;
    }

    if (tag === "ul" || tag === "ol") {
      el.querySelectorAll(":scope > li").forEach((li) => {
        const depth = getDepth(li as HTMLElement);
        const liText = li.cloneNode(true);
        (liText as HTMLElement).querySelectorAll("ul, ol").forEach((sub) => sub.remove());
        elements.push(
          new Paragraph({
            children: parseInline(liText as HTMLElement),
            bullet: tag === "ul" ? { level: Math.min(depth, 3) } : undefined,
            numbering:
              tag === "ol"
                ? { reference: "ordered-list", level: Math.min(depth, 3) }
                : undefined,
          })
        );
        li.querySelectorAll(":scope > ul, :scope > ol").forEach((subList) => {
          const subTag = subList.tagName.toLowerCase();
          subList.querySelectorAll(":scope > li").forEach((subLi) => {
            const subDepth = getDepth(subLi as HTMLElement);
            elements.push(
              new Paragraph({
                children: parseInline(subLi as HTMLElement),
                bullet: subTag === "ul" ? { level: Math.min(subDepth, 3) } : undefined,
                numbering:
                  subTag === "ol"
                    ? { reference: "ordered-list", level: Math.min(subDepth, 3) }
                    : undefined,
              })
            );
          });
        });
      });
      return;
    }

    if (tag === "br") {
      elements.push(new Paragraph({ children: [new TextRun("")] }));
      return;
    }

    el.childNodes.forEach(processNode);
  }

  div.childNodes.forEach(processNode);
  return elements.length > 0
    ? elements
    : [new Paragraph({ children: [new TextRun("")] })];
}

export async function htmlToDocxBlob(
  htmlStr: string,
  title?: string
): Promise<Blob> {
  const children = htmlToDocxElements(htmlStr);
  const doc = new Document({
    numbering: {
      config: [
        {
          reference: "ordered-list",
          levels: [
            {
              level: 0,
              format: "decimal",
              text: "%1.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.5),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
              },
            },
            {
              level: 1,
              format: "lowerLetter",
              text: "%2)",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(1.0),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
              },
            },
            {
              level: 2,
              format: "lowerRoman",
              text: "%3.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(1.5),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
              },
            },
            {
              level: 3,
              format: "decimal",
              text: "%4.",
              alignment: AlignmentType.LEFT,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(2.0),
                    hanging: convertInchesToTwip(0.25),
                  },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        properties: {},
        children: title
          ? [
              new Paragraph({
                children: [
                  new TextRun({ text: title, bold: true }),
                ],
                heading: HeadingLevel.TITLE,
              }),
              ...children,
            ]
          : children,
      },
    ],
  });
  return Packer.toBlob(doc);
}
