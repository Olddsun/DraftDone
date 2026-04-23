import os
import base64
import json
import io
import tempfile
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
from typing import Optional
import anthropic
import ezdxf
from dotenv import load_dotenv

load_dotenv()

app = FastAPI(title="DraftDone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://*.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

ANALYZE_PROMPT = """你是一個專業的室內設計平面圖解析助理。

請仔細分析這張室內設計草圖，提取所有結構元素，並以 JSON 格式回傳。

回傳格式必須嚴格遵守：
{
  "canvas_width": <整體寬度，單位公分>,
  "canvas_height": <整體高度，單位公分>,
  "walls": [
    {
      "id": "w1",
      "x1": <起點X公分>,
      "y1": <起點Y公分>,
      "x2": <終點X公分>,
      "y2": <終點Y公分>,
      "thickness": <牆厚公分，預設15>
    }
  ],
  "doors": [
    {
      "id": "d1",
      "x": <中心X公分>,
      "y": <中心Y公分>,
      "width": <門寬公分>,
      "rotation": <角度0/90/180/270>
    }
  ],
  "windows": [
    {
      "id": "win1",
      "x1": <起點X公分>,
      "y1": <起點Y公分>,
      "x2": <終點X公分>,
      "y2": <終點Y公分>
    }
  ],
  "rooms": [
    {
      "id": "r1",
      "label": <房間名稱>,
      "x": <標籤中心X公分>,
      "y": <標籤中心Y公分>
    }
  ],
  "dimensions": [
    {
      "id": "dim1",
      "x1": <起點X公分>,
      "y1": <起點Y公分>,
      "x2": <終點X公分>,
      "y2": <終點Y公分>,
      "value": <尺寸數字公分>
    }
  ]
}

重要原則：
- 如果圖片沒有明確尺寸標註，請根據一般室內設計慣例推估（單房約300-500公分）
- 只回傳 JSON，不要有任何說明文字
- 座標系統：左上角為原點(0,0)，X向右，Y向下
"""


class FloorPlan(BaseModel):
    canvas_width: float
    canvas_height: float
    walls: list
    doors: list
    windows: list
    rooms: list
    dimensions: list


@app.post("/analyze")
async def analyze_sketch(file: UploadFile = File(...)):
    """上傳草圖，回傳解析後的平面圖 JSON"""
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="請上傳圖片檔案")

    image_data = await file.read()
    base64_image = base64.standard_b64encode(image_data).decode("utf-8")

    ext = file.content_type.split("/")[-1]
    media_type = file.content_type

    message = client.messages.create(
        model="claude-opus-4-6",
        max_tokens=4096,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "image",
                        "source": {
                            "type": "base64",
                            "media_type": media_type,
                            "data": base64_image,
                        },
                    },
                    {
                        "type": "text",
                        "text": ANALYZE_PROMPT,
                    },
                ],
            }
        ],
    )

    raw = message.content[0].text.strip()

    # 清除可能的 markdown code block
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    if raw.endswith("```"):
        raw = raw[:-3]

    floor_plan = json.loads(raw.strip())
    return floor_plan


@app.post("/generate-dxf")
async def generate_dxf(floor_plan: dict):
    """根據平面圖 JSON 生成 DXF 檔案"""
    doc = ezdxf.new("R2010")
    msp = doc.modelspace()

    doc.layers.add("WALLS", color=7)
    doc.layers.add("DOORS", color=1)
    doc.layers.add("WINDOWS", color=4)
    doc.layers.add("ROOMS", color=2)
    doc.layers.add("DIMENSIONS", color=3)

    # 牆面
    for wall in floor_plan.get("walls", []):
        msp.add_line(
            (wall["x1"], -wall["y1"]),
            (wall["x2"], -wall["y2"]),
            dxfattribs={"layer": "WALLS", "lineweight": 50},
        )

    # 門（弧線表示）
    for door in floor_plan.get("doors", []):
        x, y, w = door["x"], door["y"], door["width"]
        msp.add_arc(
            center=(x, -y),
            radius=w,
            start_angle=0,
            end_angle=90,
            dxfattribs={"layer": "DOORS"},
        )
        msp.add_line((x, -y), (x + w, -y), dxfattribs={"layer": "DOORS"})

    # 窗戶（雙線表示）
    for win in floor_plan.get("windows", []):
        offset = 5
        msp.add_line(
            (win["x1"], -win["y1"]),
            (win["x2"], -win["y2"]),
            dxfattribs={"layer": "WINDOWS"},
        )
        msp.add_line(
            (win["x1"], -win["y1"] - offset),
            (win["x2"], -win["y2"] - offset),
            dxfattribs={"layer": "WINDOWS"},
        )

    # 房間標籤
    for room in floor_plan.get("rooms", []):
        msp.add_text(
            room["label"],
            dxfattribs={"layer": "ROOMS", "height": 20, "insert": (room["x"], -room["y"])},
        )

    # 尺寸線
    for dim in floor_plan.get("dimensions", []):
        msp.add_linear_dim(
            base=(dim["x1"], -dim["y1"] - 30),
            p1=(dim["x1"], -dim["y1"]),
            p2=(dim["x2"], -dim["y2"]),
            dxfattribs={"layer": "DIMENSIONS"},
        ).render()

    tmp = tempfile.NamedTemporaryFile(delete=False, suffix=".dxf")
    doc.saveas(tmp.name)

    return FileResponse(
        tmp.name,
        media_type="application/octet-stream",
        filename="floorplan.dxf",
    )


@app.get("/health")
async def health():
    return {"status": "ok"}
