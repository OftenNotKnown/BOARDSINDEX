import express from "express"
import multer from "multer"
import cors from "cors"
import { createClient } from "@supabase/supabase-js"
import Tesseract from "tesseract.js"
import fs from "fs"

const app = express()
const upload = multer({ dest: "uploads/" })

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

/* OCR FUNCTION */
async function runOCR(imagePath) {
  const result = await Tesseract.recognize(imagePath, "eng")
  return result.data.text
}

/* MAIN ENDPOINT */
app.post("/process-submission", upload.single("image"), async (req, res) => {
  try {
    const { date, notebook, title, text, user_id } = req.body

    let ocrText = ""
    let hasImage = false

    if (req.file) {
      hasImage = true
      ocrText = await runOCR(req.file.path)
      fs.unlinkSync(req.file.path) // cleanup
    }

    const contentObject = {
      version: 1,
      input: {
        pasted_text: !!text,
        image: hasImage
      },
      extracted: {
        ocr_text: ocrText.trim(),
        pasted_text: text || ""
      },
      summary: generateSummary(text, ocrText),
      confidence: {
        ocr: hasImage ? 0.6 : null
      }
    }

    const { error } = await supabase
      .from("submissions")
      .insert({
        date,
        notebook,
        title,
        content: JSON.stringify(contentObject),
        submitted_by: user_id,
        status: "pending"
      })

    if (error) {
      console.error(error)
      return res.status(500).send("Database insert failed")
    }

    res.send("OK")
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

function generateSummary(pasted, ocr) {
  if (pasted && ocr) return "Text + image submission"
  if (pasted) return "Text submission"
  if (ocr) return "Image submission (OCR)"
  return "Empty submission"
}

app.listen(process.env.PORT, () => {
  console.log(`Server running on port ${process.env.PORT}`)
})
