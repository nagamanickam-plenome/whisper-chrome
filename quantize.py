import os
from onnxruntime.quantization import quantize_dynamic, QuantType

model_input = "public/models/onnx-community/onnx/model.onnx"
model_output = "public/models/onnx-community/onnx/model_quantized.onnx"

print(f"Quantizing {model_input} to INT8...")
if os.path.exists(model_input):
    quantize_dynamic(
        model_input=model_input,
        model_output=model_output,
        weight_type=QuantType.QUInt8
    )
    print(f"Successfully created {model_output}!")
else:
    print(f"Error: {model_input} not found.")
