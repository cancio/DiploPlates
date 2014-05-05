tests:
	@./node_modules/.bin/mocha --reporter spec -u tdd

.PHONY:	tests