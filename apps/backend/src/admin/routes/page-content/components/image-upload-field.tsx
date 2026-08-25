import { useRef, useState } from "react"
import { Button, Label, Text, toast } from "@medusajs/ui"
import { sdk } from "../../../lib/sdk"

type Props = {
  label: string
  value: string | null
  onChange: (url: string | null) => void
}

function toSafeFile(file: File): File {
  const extMatch = /\.[a-zA-Z0-9]+$/.exec(file.name)
  const ext = extMatch ? extMatch[0] : ""
  const safeName = `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 10)}${ext}`

  return new File([file], safeName, {
    type: file.type,
    lastModified: file.lastModified,
  })
}

export default function ImageUploadField({ label, value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)

  const handleFile = async (file: File | undefined) => {
    if (!file) {
      return
    }

    setIsUploading(true)
    try {
      const res = await sdk.admin.upload.create({
        files: [toSafeFile(file)],
      })
      const url = res.files?.[0]?.url
      if (url) {
        onChange(url)
      } else {
        toast.error("Не вдалося отримати URL завантаженого файлу")
      }
    } catch (err: any) {
      toast.error(err?.message || "Помилка завантаження файлу")
    } finally {
      setIsUploading(false)
      if (inputRef.current) {
        inputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex flex-col gap-y-2">
      <Label size="small">{label}</Label>
      <div className="flex items-center gap-x-3">
        {value ? (
          <img
            src={value}
            alt=""
            className="h-16 w-16 rounded-md object-cover border border-ui-border-base"
          />
        ) : (
          <div className="h-16 w-16 rounded-md border border-dashed border-ui-border-base flex items-center justify-center">
            <Text size="xsmall" className="text-ui-fg-muted">
              немає
            </Text>
          </div>
        )}
        <div className="flex flex-col gap-y-1">
          <Button
            size="small"
            variant="secondary"
            type="button"
            isLoading={isUploading}
            onClick={() => inputRef.current?.click()}
          >
            {value ? "Замінити зображення" : "Завантажити зображення"}
          </Button>
          {value && (
            <Button
              size="small"
              variant="transparent"
              type="button"
              onClick={() => onChange(null)}
            >
              Видалити
            </Button>
          )}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </div>
    </div>
  )
}