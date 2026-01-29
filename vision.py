import cv2
import numpy as np

# =========================
# MODE CONFIG
# =========================
MODE = "video"   # "image" or "video"

INPUT_PATH = "crowd.mp4"   # image OR video file path

# =========================
# GROUND ROI (tune)
# =========================
GROUND_X1 = 168
GROUND_Y1 = 212
GROUND_X2 = 823
GROUND_Y2 = 532

SECTOR_COLORS = {
    "A": (255, 0, 0),
    "B": (0, 255, 0),
    "C": (0, 255, 255),
    "D": (0, 0, 255)
}

# =========================
# DENSITY CLASSIFICATION
# =========================
def classify_density_ratio(r):
    if r < 0.03:
        return "LOW"
    elif r < 0.07:
        return "MEDIUM"
    elif r < 0.12:
        return "HIGH"
    else:
        return "CRITICAL"

# =========================
# CORE FUNCTIONS
# =========================
def estimate_edge_density(roi):
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5,5), 0)
    edges = cv2.Canny(blur, 50, 150)
    return np.count_nonzero(edges) / (roi.shape[0] * roi.shape[1])

def draw_sectors(frame):
    x1,y1,x2,y2 = GROUND_X1,GROUND_Y1,GROUND_X2,GROUND_Y2
    mid_x = x1 + (x2-x1)//2
    mid_y = y1 + (y2-y1)//2

    t = 3
    cv2.rectangle(frame,(x1,y1),(mid_x,mid_y),SECTOR_COLORS["A"],t)
    cv2.rectangle(frame,(mid_x,y1),(x2,mid_y),SECTOR_COLORS["B"],t)
    cv2.rectangle(frame,(x1,mid_y),(mid_x,y2),SECTOR_COLORS["C"],t)
    cv2.rectangle(frame,(mid_x,mid_y),(x2,y2),SECTOR_COLORS["D"],t)

    return mid_x, mid_y

def process_frame(frame):
    frame = cv2.resize(frame,(960,540))
    mid_x, mid_y = draw_sectors(frame)

    cv2.rectangle(frame,(GROUND_X1,GROUND_Y1),(GROUND_X2,GROUND_Y2),(255,255,255),2)

    sectors = {
        "A": frame[GROUND_Y1:mid_y, GROUND_X1:mid_x],
        "B": frame[GROUND_Y1:mid_y, mid_x:GROUND_X2],
        "C": frame[mid_y:GROUND_Y2, GROUND_X1:mid_x],
        "D": frame[mid_y:GROUND_Y2, mid_x:GROUND_X2]
    }

    densities, statuses = {}, {}

    for s,roi in sectors.items():
        d = estimate_edge_density(roi)
        densities[s] = d
        statuses[s] = classify_density_ratio(d)

    max_s = max(densities, key=densities.get)
    min_s = min(densities, key=densities.get)

    if statuses[max_s] in ["HIGH","CRITICAL"]:
        message = f"Sector {max_s} overcrowded → Redirect to Sector {min_s}"
    else:
        message = "Crowd distribution normal"

    font = cv2.FONT_HERSHEY_SIMPLEX
    positions = {
        "A": (20,40),
        "B": (mid_x+20,40),
        "C": (20,mid_y+40),
        "D": (mid_x+20,mid_y+40)
    }

    for s in sectors:
        txt = f"{s} | {densities[s]:.3f} | {statuses[s]}"
        cv2.putText(frame,txt,positions[s],font,0.7,SECTOR_COLORS[s],2)

    cv2.putText(frame,message,(20,520),font,0.9,(255,255,255),2)

    return frame

# =========================
# IMAGE MODE
# =========================     
if MODE == "image":
    frame = cv2.imread(INPUT_PATH)
    if frame is None:
        print("Could not load image")
        exit()

    result = process_frame(frame)

    cv2.imshow("Crowd Density Monitor", result)
    cv2.waitKey(0)
    cv2.destroyAllWindows()

# =========================
# VIDEO MODE
# =========================
else:
    cap = cv2.VideoCapture(INPUT_PATH)

    if not cap.isOpened():
        print("Could not open video")
        exit()

    while True:
        ret, frame = cap.read()
        if not ret:
            break

        result = process_frame(frame)

        cv2.imshow("Crowd Density Monitor", result)

        if cv2.waitKey(1) & 0xFF == ord('q'):
            break

    cap.release()
    cv2.destroyAllWindows()
