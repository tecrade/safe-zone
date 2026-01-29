import cv2

# Load image or first frame of video
cap = cv2.VideoCapture("gec_crowd.jpg")  # or video path
ret, frame = cap.read()
cap.release()

if frame is None:
    raise Exception("Could not load frame")

# Resize for consistency
frame = cv2.resize(frame, (960, 540))

# Select ROI manually
roi = cv2.selectROI(
    "Draw ground area and press ENTER",
    frame,
    showCrosshair=True,
    fromCenter=False
)

cv2.destroyAllWindows()

x, y, w, h = roi
x1, y1 = int(x), int(y)
x2, y2 = int(x + w), int(y + h)

print("Copy these coordinates into your main file:")
print(f"GROUND_X1 = {x1}")
print(f"GROUND_Y1 = {y1}")
print(f"GROUND_X2 = {x2}")
print(f"GROUND_Y2 = {y2}")
