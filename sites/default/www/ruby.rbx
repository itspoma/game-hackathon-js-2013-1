puts "Hello World 1!"

class HelloWorld
   def initialize(name)
      @name = name.capitalize
   end
   def sayHi
      puts "Hello #{@name}!"
   end
end

hello = HelloWorld.new("World")
hello.sayHi

puts "ruby #{RUBY_VERSION}-p#{RUBY_PATCHLEVEL}"