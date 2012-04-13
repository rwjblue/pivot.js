require 'uglifier'
require_relative './demo_csv_builder.rb'

# Order matters.
@manifest = [ 'begin.js',
              'init.js',
              'utils.js',
              'processing.js',
              'filters.js',
              'fields.js',
              'data.js',
              'display.js',
              'results.js',
              'entry.js',
              'end.js'
            ]

namespace :pivot do
  desc "Compiles docs"
  task :docs => :compile do
    system("jsduck ./pivot.js --output ./docs")
    $stdout.puts "Docs have generated"
  end

  desc "Compiles individual .js files into pivot.js and pivot.min.js"
  task :compile do
    lines = []
    @manifest.each do |file|
      lines << File.open(File.join('./src', file)).readlines
    end
    pivot_js = File.open('./pivot.js','w') {|f| f.puts(lines) }
    File.open('./pivot.min.js', 'w') {|f| f.puts Uglifier.new.compile(File.read('./pivot.js')) }
  end

  desc "Generates demo CSV for pivot.js gh-pages."
  task :csv do
    dcsv = DemoCSV.new(5000)
    dcsv.to_file "./lib/csv/demo.csv"
    $stdout.puts "Generate demo CSV successful"
  end

end