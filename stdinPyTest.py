import fileinput

input = "";
for line in fileinput.input():
    input += line;

print(fileinput.input());
print(*map(input().count, "ACGT"));
