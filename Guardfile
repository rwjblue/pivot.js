guard :shell do
  watch(/^src\/.+\.js/) { `rake pivot:compile && rake pivot:docs` }
end