import express from "express"
import multer from "multer"
import cors from "cors"
import fs from "fs"
import Tesseract from "tesseract.js"
import { createClient } from "@supabase/supabase-js"

const app = express()
const upload = multer({ dest: "uploads/" })

app.use(cors())
app.use(express.json())

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

async function runOCR(path) {
  const result = await Tesseract.recognize(path, "eng")
  return result.data.text
}

app.post("/process-submission", upload.single("image"), async (req, res) => {
  try {
    const { date, notebook, title, text, user_id } = req.body

    let ocrText = ""
    let hasImage = false

    if (req.file) {
      hasImage = true
      ocrText = await runOCR(req.file.path)
      fs.unlinkSync(req.file.path)
    }

    const content = {
      version: 1,
      input: {
        text: !!text,
        image: hasImage
      },
      extracted: {
        pasted_text: text || "",
        ocr_text: ocrText.trim()
      },
      summary: hasImage && text
        ? "Text + image submission"
        : hasImage
        ? "Image submission"
        : "Text submission",
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
        content: JSON.stringify(content),
        submitted_by: user_id,
        status: "pending"
      })

    if (error) {
      console.error(error)
      return res.status(500).send("DB error")
    }

    res.send("OK")
  } catch (err) {
    console.error(err)
    res.status(500).send("Server error")
  }
})

app.listen(process.env.PORT, () =>
  console.log("Server running on port", process.env.PORT)
)
