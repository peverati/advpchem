-- For printable formats (docx, PDF): drop the interactive placeholders
-- (divs with a data-lab attribute) and any heading that only introduced one,
-- so the handout reads cleanly on paper. HTML output is left untouched.

local function is_lab_div(b)
  return b and b.t == "Div" and b.attributes["data-lab"] ~= nil
end

-- Badge images (SVG) can't be embedded in Word; use plain text instead.
function Image(img)
  if not quarto.doc.is_format("html") and img.src:match("colab%-badge") then
    return pandoc.Str("Open in Colab")
  end
end

function Blocks(blocks)
  if quarto.doc.is_format("html") then return nil end
  local out = pandoc.Blocks({})
  local i = 1
  while i <= #blocks do
    local b = blocks[i]
    if b.t == "Header" and is_lab_div(blocks[i + 1]) then
      -- skip the heading; the div itself is skipped on the next iteration
    elseif is_lab_div(b) then
      -- skip
    elseif b.t == "Div" and b.attributes["data-lab-exp"] ~= nil then
      -- skip the page marker
    else
      out:insert(b)
    end
    i = i + 1
  end
  return out
end
